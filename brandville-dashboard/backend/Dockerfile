FROM php:8.3-cli
RUN apt-get update && apt-get install -y git unzip libzip-dev default-mysql-client \
    && docker-php-ext-install pdo pdo_mysql \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction
ENV PORT=8080
EXPOSE 8080
CMD sh -c "php artisan config:cache && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT}"
