<?php

function randomString($length) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';

    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }

    return $randomString;
}

parse_str($_SERVER['QUERY_STRING'], $queryArray);

switch($queryArray['cmd']){
    case 'API_GpsFileListReq':
        echo(file_get_contents('g.json', 'r'));
        break;
    case 'API_RequestSessionID':
        $data = ['acSessionId' => randomString(10)];
        $response = ['errcode'=>0, 'data'=> json_encode($data)];
        echo(json_encode($response));
        break;
    case 'API_RequestCertificate':
    case 'API_SyncDate':
        $response = ['errcode'=>0];
        echo(json_encode($response));
        break;
    default:
        http_response_code(403);
        die('invalid cmd');
        break;
}

http_response_code(200);