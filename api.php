<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Cache-Control: no-store, no-cache, must-revalidate');

function respondJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function generateUuidV4(): string
{
    return 'MST-' . random_int(1000, 9999);
}

function getRequestPayload(): array
{
    $raw = file_get_contents('php://input');
    if (is_string($raw) && trim($raw) !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return $_POST;
}

function fetchDashboardState(PDO $pdo, string $search = '', string $statusFilter = 'All'): array
{
    $suitesStmt = $pdo->query(
        'SELECT suite_code, kicker, name, description, nightly_rate, pin_icon_url, max_guests
         FROM suites
         ORDER BY id ASC'
    );
    $suites = $suitesStmt->fetchAll();

    $where = [];
    $params = [];

    if ($statusFilter !== '' && $statusFilter !== 'All') {
        $where[] = 'b.status = :status';
        $params[':status'] = $statusFilter;
    }

    if ($search !== '') {
        $where[] = '(b.guest_name LIKE :q1 OR b.guest_email LIKE :q2 OR s.name LIKE :q3 OR b.booking_ref LIKE :q4)';
        $like = '%' . $search . '%';
        $params[':q1'] = $like;
        $params[':q2'] = $like;
        $params[':q3'] = $like;
        $params[':q4'] = $like;
    }

    $whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

    $bookingsSql = "
        SELECT
            b.id,
            b.booking_ref,
            b.suite_code,
            s.name AS suite_name,
            s.nightly_rate,
            b.guest_name,
            b.guest_email,
            b.check_in,
            b.check_out,
            b.guests,
            b.nights,
            b.total_price,
            b.status,
            b.special_requests,
            b.created_at
        FROM bookings b
        INNER JOIN suites s ON s.suite_code = b.suite_code
        {$whereSql}
        ORDER BY b.check_in ASC, b.id DESC
    ";

    $stmt = $pdo->prepare($bookingsSql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    $statsStmt = $pdo->query(
        'SELECT
            COUNT(*) AS total_count,
            COALESCE(SUM(total_price), 0) AS total_revenue,
            COALESCE(SUM(nights), 0) AS total_nights
         FROM bookings'
    );
    $stats = $statsStmt->fetch() ?: ['total_count' => 0, 'total_revenue' => 0, 'total_nights' => 0];

    return [
        'ok'       => true,
        'database' => 'hotelbookingsystem',
        'suites'   => $suites,
        'bookings' => $bookings,
        'stats'    => [
            'total_count'   => (int) $stats['total_count'],
            'total_revenue' => (float) $stats['total_revenue'],
            'total_nights'  => (int) $stats['total_nights'],
        ],
    ];
}

function validateBookingInput(PDO $pdo, array $input): array
{
    $guestName       = trim((string) ($input['guest_name'] ?? ''));
    $guestEmail      = trim((string) ($input['guest_email'] ?? ''));
    $suiteCode       = trim((string) ($input['suite_code'] ?? ''));
    $checkIn         = trim((string) ($input['check_in'] ?? ''));
    $checkOut        = trim((string) ($input['check_out'] ?? ''));
    $guests          = (int) ($input['guests'] ?? 2);
    $status          = trim((string) ($input['status'] ?? 'Confirmed'));
    $specialRequests = trim((string) ($input['special_requests'] ?? ''));

    if ($guestName === '' || mb_strlen($guestName) > 120) {
        respondJson(422, ['ok' => false, 'error' => 'Please enter a valid guest full name (1–120 characters).']);
    }

    if (!filter_var($guestEmail, FILTER_VALIDATE_EMAIL) || mb_strlen($guestEmail) > 160) {
        respondJson(422, ['ok' => false, 'error' => 'Please enter a valid guest email address.']);
    }

    $allowedStatuses = ['Confirmed', 'Pending', 'Checked-In'];
    if (!in_array($status, $allowedStatuses, true)) {
        respondJson(422, ['ok' => false, 'error' => 'Invalid reservation status selected.']);
    }

    if ($guests < 1 || $guests > 6) {
        respondJson(422, ['ok' => false, 'error' => 'Guest count must be between 1 and 6.']);
    }

    $inDate  = DateTimeImmutable::createFromFormat('Y-m-d', $checkIn);
    $outDate = DateTimeImmutable::createFromFormat('Y-m-d', $checkOut);
    if (!$inDate || !$outDate || $inDate->format('Y-m-d') !== $checkIn || $outDate->format('Y-m-d') !== $checkOut) {
        respondJson(422, ['ok' => false, 'error' => 'Please provide valid check-in and check-out dates (YYYY-MM-DD).']);
    }

    $diffDays = (int) $inDate->diff($outDate)->format('%r%a');
    if ($diffDays < 1) {
        respondJson(422, ['ok' => false, 'error' => 'Check-out date must be at least 1 night after check-in date.']);
    }

    if ($diffDays > 90) {
        respondJson(422, ['ok' => false, 'error' => 'Reservations cannot exceed 90 nights per booking.']);
    }

    $suiteStmt = $pdo->prepare('SELECT suite_code, name, nightly_rate, max_guests FROM suites WHERE suite_code = :code LIMIT 1');
    $suiteStmt->execute([':code' => $suiteCode]);
    $suite = $suiteStmt->fetch();

    if (!$suite) {
        respondJson(422, ['ok' => false, 'error' => 'Selected heritage suite does not exist.']);
    }

    $nightlyRate = (float) $suite['nightly_rate'];
    $totalPrice  = round($nightlyRate * $diffDays, 2);

    return [
        'guest_name'       => $guestName,
        'guest_email'      => $guestEmail,
        'suite_code'       => $suiteCode,
        'check_in'         => $checkIn,
        'check_out'        => $checkOut,
        'guests'           => $guests,
        'nights'           => $diffDays,
        'total_price'      => $totalPrice,
        'status'           => $status,
        'special_requests' => mb_substr($specialRequests, 0, 255),
    ];
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = (string) ($_GET['action'] ?? '');

    if ($action === 'font') {
        $fontUrl = 'https://dcym8fthxf5uu.cloudfront.net/fonts/247a073c-29f5-4a89-aa3a-741020f346fc/OggText-Medium.woff2';
        $ctx = stream_context_create([
            'http' => ['timeout' => 10],
            'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
        ]);
        $fontData = @file_get_contents($fontUrl, false, $ctx);
        if ($fontData !== false) {
            header('Content-Type: font/woff2');
            header('Access-Control-Allow-Origin: *');
            header('Cache-Control: public, max-age=31536000, immutable');
            echo $fontData;
            exit;
        }
        http_response_code(404);
        exit;
    }

    $pdo    = getDatabaseConnection();
    $body   = $method === 'GET' ? [] : getRequestPayload();
    $action = (string) ($_GET['action'] ?? $body['action'] ?? ($method === 'GET' ? 'list' : ''));

    if ($method === 'GET' || $action === 'list') {
        $search = trim((string) ($_GET['search'] ?? $body['search'] ?? ''));
        $status = trim((string) ($_GET['status'] ?? $body['status'] ?? 'All'));
        respondJson(200, fetchDashboardState($pdo, $search, $status));
    }

    if ($action === 'create') {
        $data = validateBookingInput($pdo, $body);
        $bookingRef = generateUuidV4();

        $pdo->beginTransaction();
        $insertStmt = $pdo->prepare(
            'INSERT INTO bookings
                (booking_ref, suite_code, guest_name, guest_email, check_in, check_out, guests, nights, total_price, status, special_requests)
             VALUES
                (:booking_ref, :suite_code, :guest_name, :guest_email, :check_in, :check_out, :guests, :nights, :total_price, :status, :special_requests)'
        );
        $insertStmt->execute([
            ':booking_ref'      => $bookingRef,
            ':suite_code'       => $data['suite_code'],
            ':guest_name'       => $data['guest_name'],
            ':guest_email'      => $data['guest_email'],
            ':check_in'         => $data['check_in'],
            ':check_out'        => $data['check_out'],
            ':guests'           => $data['guests'],
            ':nights'           => $data['nights'],
            ':total_price'      => $data['total_price'],
            ':status'           => $data['status'],
            ':special_requests' => $data['special_requests'],
        ]);
        $newId = (int) $pdo->lastInsertId();
        $pdo->commit();

        $state = fetchDashboardState($pdo);
        $state['message'] = 'Reservation created successfully.';
        $state['created_id'] = $newId;
        $state['booking_ref'] = $bookingRef;
        respondJson(201, $state);
    }

    if ($action === 'update') {
        $bookingId = (int) ($body['id'] ?? $_GET['id'] ?? 0);
        if ($bookingId <= 0) {
            respondJson(422, ['ok' => false, 'error' => 'Valid reservation ID is required for update.']);
        }

        $existsStmt = $pdo->prepare('SELECT id FROM bookings WHERE id = :id LIMIT 1');
        $existsStmt->execute([':id' => $bookingId]);
        if (!$existsStmt->fetch()) {
            respondJson(404, ['ok' => false, 'error' => 'Reservation not found in database.']);
        }

        $data = validateBookingInput($pdo, $body);

        $pdo->beginTransaction();
        $updateStmt = $pdo->prepare(
            'UPDATE bookings
             SET suite_code       = :suite_code,
                 guest_name       = :guest_name,
                 guest_email      = :guest_email,
                 check_in         = :check_in,
                 check_out        = :check_out,
                 guests           = :guests,
                 nights           = :nights,
                 total_price      = :total_price,
                 status           = :status,
                 special_requests = :special_requests
             WHERE id = :id'
        );
        $updateStmt->execute([
            ':suite_code'       => $data['suite_code'],
            ':guest_name'       => $data['guest_name'],
            ':guest_email'      => $data['guest_email'],
            ':check_in'         => $data['check_in'],
            ':check_out'        => $data['check_out'],
            ':guests'           => $data['guests'],
            ':nights'           => $data['nights'],
            ':total_price'      => $data['total_price'],
            ':status'           => $data['status'],
            ':special_requests' => $data['special_requests'],
            ':id'               => $bookingId,
        ]);
        $pdo->commit();

        $state = fetchDashboardState($pdo);
        $state['message'] = 'Reservation #' . $bookingId . ' updated.';
        respondJson(200, $state);
    }

    if ($action === 'delete') {
        $bookingId = (int) ($body['id'] ?? $_GET['id'] ?? 0);
        if ($bookingId <= 0) {
            respondJson(422, ['ok' => false, 'error' => 'Valid reservation ID is required for deletion.']);
        }

        $pdo->beginTransaction();
        $delStmt = $pdo->prepare('DELETE FROM bookings WHERE id = :id');
        $delStmt->execute([':id' => $bookingId]);
        $deletedCount = $delStmt->rowCount();
        $pdo->commit();

        if ($deletedCount === 0) {
            respondJson(404, ['ok' => false, 'error' => 'Reservation not found or already deleted.']);
        }

        $state = fetchDashboardState($pdo);
        $state['message'] = 'Reservation deleted from database.';
        respondJson(200, $state);
    }

    respondJson(400, ['ok' => false, 'error' => 'Unsupported API action.']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondJson(500, [
        'ok'    => false,
        'error' => 'Database operation failed. Please verify the MySQL connection.',
    ]);
}
