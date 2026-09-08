@props(['title' => 'FUNDERR', 'auth' => false])

    <!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }} — IATER</title>
    <link rel="icon" type="image/png" href="{{ asset('favicon.png') }}">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body class="min-h-screen text-base-content {{ $auth ? 'bg-base-100' : 'bg-base-200' }}">
<main class="{{ $auth ? 'flex min-h-svh items-center justify-center px-6 py-12' : 'mx-auto max-w-5xl p-6' }}">
    {{ $slot }}
</main>
</body>

</html>
