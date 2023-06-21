<?php
header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Access-Control-Allow-Origin: *");
header('content-type: application/json; charset=utf-8');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT); // it will tell us errors so i have to do less error handling manually!!!!
$con = mysqli_connect("localhost", "", "", "");

$data = json_decode(file_get_contents("php://input"));
$type = $data->{'type'};    // type of request
$dog  = $data->{'dog'};     // name of the dog
$post = $data->{'post'};

if (empty($dog) || empty($type)) {
    exit("fields not completed");
}

if ($type == "send") {
    if ($stmt = $con->prepare("UPDATE dogs SET data = ? WHERE name = ?")) {
        $stmt->bind_param("ss", $post, $dog);
        $stmt->execute();
        exit("updated dog data!");
    } else exit("error preparing db, try again nerd");
} else if ($type == "recieve") {
    if ($stmt = $con->prepare('SELECT data FROM dogs WHERE name = ?')) {
        $stmt->bind_param('s', $dog);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows == 0) {
            exit("failed to find the correct dog");
        }

        $stmt->bind_result($dog_data);
        $stmt->fetch();
        exit($dog_data);
    } else exit("error preparing db");
}