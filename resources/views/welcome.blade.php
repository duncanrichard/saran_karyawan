<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Ruang saran internal untuk karyawan.">
        <title>Suara Karyawan</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body>
        <div id="employee-portal"></div>
    </body>
</html>
