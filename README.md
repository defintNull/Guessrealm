## Descrizione del Progetto

Guessrealm è un'applicazione web sviluppata con il framework **Laravel**, progettata per offrire un'esperienza interattiva e coinvolgente.
L'app consente agli utenti di partecipare al classico gioco di Indovina Chi reso più dinamico attraverso l'introduzione di un modello di ML per l'analisi
facciale dei volti in modo da garantire una partita con volti più vari rispetto ad un set specifico con caratteristiche hardcodate.
Consiste in due modalità, una singleplayer contro un bot con difficoltà regolabile e una multiplayer contro un altro giocatore in tempo reale.

## Tecnologie utilizzate

- **Laravel** (PHP)
- **React** per il frontend
- **Tailwind CSS** per lo styling
- **MySQL / MariaDB** per il database relazionale
- **Redis** per cache, sessioni e code di background
- **WebSockets** per il broadcasting in tempo reale
- **Python** (server fastApi per popolazione database)

## Requirementes

1. php 8.2^
2. node 22^
3. composer
4. python
5. docker (opzionale)

## Configurazione

1. Copia il file di ambiente e genera la chiave dell'applicazione:
```bash
cp .env.example .env
php artisan key:generate
```
2. Installa le dipendenze:
```bash
composer install
npm install
```
3. Configurazione variabili di ambiente
   
   1. Se si sceglie di usare docker con Laravel Sail configurare
        ```bash
        REVERB_APP_ID=
        REVERB_APP_KEY=
        REVERB_APP_SECRET=
        ```
   2. Se non si usa docker
        configurare l'env secondo i servizi che si usa sulla propria macchina per db, porte etc e modificare
        ```bash
        REDIS_DRIVER=false
        ```
    
   
4. Esegui le migrazioni e i seeder:
```bash
php artisan migrate
php artisan db:seed
```

## Avvio
1. Con docker e Laravel Sali
   1. Configurare un alias per Laravel Sali
        ```bash
        nano ~/.bashrc
        alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'
        ```
   2. Avviare Laravel Sail
        ```bash
        sail up
        ```
   3. Avviare il resto dei servizzi
        ```bash
        sail npm run dev
        sail artisan reverb:start
        sail artisan queue:work --queue=high,medium,low
        php artisan schedule:work
        ```
        
2. Senza l'utilizzo di docker:
    1. Configurare server python (vedi readme in PythonServer)

    2. Avviare i vari servizzi
    ```bash
    php artisan serve
    npm run dev
    php artisan reverb:start
    php artisan queue:work --queue=high,medium,low
    php artisan schedule:work
    cd PythonServer
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
    ```
