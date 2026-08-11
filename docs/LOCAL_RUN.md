# Local startup

The project includes turnkey startup scripts for Windows and Linux/macOS. They:

1. verify Node.js 20+ and npm;
2. create/fix the local `.env` values and generate a JWT secret when needed;
3. install dependencies when `node_modules` is missing;
4. create the SQLite `db` directory;
5. generate Prisma Client;
6. synchronize the Prisma schema and seed any missing catalog records without deleting panel data;
7. start Next.js on port 3000.

## Windows

From PowerShell in the project directory:

```powershell
.\start-local.ps1
```

If PowerShell execution policy blocks scripts, use the batch wrapper instead:

```bat
start-local.bat
```

The batch wrapper launches the PowerShell script with execution-policy bypass for this process only.

## Linux / macOS

```bash
chmod +x start-local.sh
./start-local.sh
```

## URLs

- Site: `http://localhost:3000`
- Admin panel: `http://localhost:3000/panel`

On a new local environment, if no admin password is configured, the helper uses:

- Username: `admin`
- Password: `Admin123456!`

Change that password before any production deployment.

## Normal manual start

The npm `dev` script is now cross-platform, so after initial setup this also works on Windows, Linux, and macOS:

```bash
npm run dev
```
