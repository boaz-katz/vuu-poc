# Vuu PostgreSQL proof of concept

The PoC loads `SCHOOL.enrolledStudents` from PostgreSQL. The SQL joins `students` to the integer IDs held in `classes.student_ids`.

## Ports

```text
PostgreSQL:                  127.0.0.1:5434
Vuu desktop UI + login:      https://localhost:8444
Vuu WebSocket:               wss://localhost:8091/websocket
PoC WebSocket inspector:     https://localhost:8445
```

## Start PostgreSQL

```powershell
docker compose up -d
docker compose exec postgres psql -U vuu -d vuu_poc -c "SELECT * FROM students;"
```

The local database credentials are `vuu` / `vuu_dev_password`.

## Prepare PowerShell

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:TEMP = 'C:\development\poc-pub-sub\.jvm-tmp'
$env:TMP = 'C:\development\poc-pub-sub\.jvm-tmp'
```

## Build the server

```powershell
.\mvnw.cmd -pl example/main -am compile -DskipTests -rf :main
```

## Start Vuu desktop UI

Start Vuu from `example/main` with the standard desktop UI webroot:

```powershell
cd example\main
..\..\mvnw.cmd "-Dvuu.webroot=../../vuu-ui/deployed_apps/app-vuu-example" exec:exec
```

Open `https://localhost:8444/index.html`, sign in, then select **SCHOOL Tables** > **SCHOOL Enrolled Students**.

## Start the PoC WebSocket inspector

Leave Vuu running. In a second PowerShell window, run:

```powershell
cd C:\development\poc-pub-sub\vuu\poc-ui
node server.mjs
```

Open `https://localhost:8445/index.html`. Do not open `index.html` using a `file:///` URL. The local PoC server proxies login to Vuu on port `8444`, then the browser connects directly to Vuu on port `8091`.

After signing in, select **Connect and subscribe**. The raw JSON log shows `LOGIN_SUCCESS`, table metadata, viewport creation, and the student rows. The Vuu desktop UI remains available on port `8444` at the same time.

## Build the Vuu desktop UI after configuration changes

```powershell
cd vuu-ui
npm.cmd run build:app
```

## Port conflicts

```powershell
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalPort -in 8090, 8091, 8443, 8444, 8445 } |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Inspect a PID before stopping it. If it is an old Vuu Java process, run `Stop-Process -Id <PID> -Force`.
