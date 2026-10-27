@echo off
rem Lance le Flavolo Quizz : demarre le petit serveur local puis ouvre le quiz dans le navigateur.
rem (Le quiz ne marche pas en ouvrant gouts.html directement : le navigateur bloque les modeles 3D.)
cd /d "%~dp0"
start "Serveur Flavolo Quizz - ne pas fermer" /min python -m http.server 5500
timeout /t 2 /nobreak >nul
start "" "http://localhost:5500/gouts.html"
