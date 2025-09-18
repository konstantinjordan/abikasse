// api/server.js

const express = require('express');
const msal = require('@azure/msal-node');

const app = express();

// Konfiguration der Microsoft Identity Platform
const msalConfig = {
    auth: {
        // Diese Werte werden von Vercel aus den Umgebungsvariablen geladen
        clientId: process.env.MSAL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.MSAL_TENANT_ID}`,
        clientSecret: process.env.MSAL_CLIENT_SECRET
    }
};

const msalApp = new msal.ConfidentialClientApplication(msalConfig);

// Route für den Login
app.get('/login', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: process.env.MSAL_REDIRECT_URI
    };
    
    // Leitet den Benutzer zur Microsoft-Anmeldeseite weiter
    msalApp.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            res.redirect(response);
        })
        .catch((error) => console.log(error));
});

// Callback-Route nach erfolgreicher Anmeldung
app.get('/auth/callback', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: process.env.MSAL_REDIRECT_URI
    };
    
    msalApp.acquireTokenByCode(tokenRequest)
        .then((response) => {
            // Hier könnten wir die Benutzerdaten speichern oder verarbeiten
            const user = response.account;
            
            // Leite den Benutzer zurück zum Frontend mit Benutzerdaten in der URL
            res.redirect(`/?loggedIn=true&userName=${encodeURIComponent(user.name)}`);
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send("Authentifizierungsfehler.");
        });
});

// Vercel benötigt diese Zeile, um die Express-App als Serverless Function zu exportieren
module.exports = app;