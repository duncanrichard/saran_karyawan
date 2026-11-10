<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Area management Suara Karyawan.">
        <title>Management | Suara Karyawan</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/management.js'])
    </head>
    <body>
        <div id="management-portal"></div>
    </body>
</html>
