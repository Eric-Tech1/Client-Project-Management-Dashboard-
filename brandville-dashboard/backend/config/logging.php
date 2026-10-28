<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [
    'default' => env('LOG_CHANNEL', 'stack'),
    'deprecations' => ['channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'), 'trace' => false],
    'channels' => [
        'stack' => ['driver' => 'stack', 'channels' => explode(',', env('LOG_STACK', 'single')), 'ignore_exceptions' => false],
        'single' => ['driver' => 'single', 'path' => storage_path('logs/laravel.log'), 'level' => env('LOG_LEVEL', 'debug'), 'replace_placeholders' => true],
        'stderr' => ['driver' => 'monolog', 'handler' => StreamHandler::class, 'with' => ['stream' => 'php://stderr'], 'level' => env('LOG_LEVEL', 'debug'), 'processors' => [PsrLogMessageProcessor::class]],
        'syslog' => ['driver' => 'monolog', 'handler' => SyslogUdpHandler::class, 'level' => env('LOG_LEVEL', 'debug'), 'handler_with' => ['host' => env('PAPERTRAIL_URL'), 'port' => env('PAPERTRAIL_PORT')], 'processors' => [PsrLogMessageProcessor::class]],
        'null' => ['driver' => 'monolog', 'handler' => NullHandler::class],
    ],
];
