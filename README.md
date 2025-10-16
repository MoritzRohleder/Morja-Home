# 🏠 MorjaHome

> **MorjaHome** ist ein privates, modular aufgebautes Self-Hosting-Projekt für den Raspberry Pi oder einen Heimserver.  
> Es kombiniert einen **Linkmanager**, einen **Foto-Server**, eine **Minecraft-Server-Verwaltung**, sowie die Integration von **Vaultwarden**.  
> Ziel ist es, alle privaten Webdienste und Daten in einer zentralen, sicheren und einfach bedienbaren Oberfläche zu bündeln.

---

## 🧭 Inhaltsverzeichnis

1. [Ziel & Konzept](#-ziel--konzept)
2. [Systemübersicht](#-systemübersicht)
3. [Kernfunktionen](#-kernfunktionen)
4. [Architektur](#-architektur)
5. [Module im Detail](#-module-im-detail)
6. [Benutzer- & Rollensystem](#-benutzer--rollensystem)
7. [Zwei-Faktor-Authentifizierung (2FA)](#-zwei-faktor-authentifizierung-2fa)
8. [Datenhaltung](#-datenhaltung)
9. [Projektstruktur](#-projektstruktur)
10. [UI & Designkonzept](#-ui--designkonzept)
11. [Erweiterung & Skalierung](#-erweiterung--skalierung)
12. [Technologien](#-technologien)
13. [Zukünftige Erweiterungen](#-zukünftige-erweiterungen)

---

## 🎯 Ziel & Konzept

**MorjaHome** dient als persönliches Dashboard für den Heimgebrauch.  
Es ermöglicht:
- Verwaltung und Anzeige wichtiger Links  
- Hosting eines privaten Foto-Servers  
- Steuerung von Minecraft-Servern  
- Anzeige von Vaultwarden-Server-Informationen  
- Benutzerverwaltung mit Rollen und 2FA  

Das gesamte System läuft lokal (z. B. auf einem Raspberry Pi 5) und kann über das Internet zugänglich gemacht werden, wobei Sicherheits- und Rollenkonzepte den Zugriff regulieren.

---

## 🏗️ Systemübersicht

```
graph TD
  subgraph Frontend
    UI[Web-Oberfläche (EJS, HTML, CSS, JS)]
    Dashboard[Linkmanager-Dashboard]
    Photos[Foto-Server-Galerie]
    Profile[Profilseite mit 2FA]
    Admin[Admin-Interface (nur LAN)]
  end

  subgraph Backend
    Express[Node.js Express Server]
    Auth[Auth-System (Login, 2FA, Rollen)]
    Services[Service Layer (Link, Photo, MC, Vault)]
    Data[JSON-Datenhaltung]
  end

  subgraph Storage
    JSON[Benutzer-, Link- & Foto-Daten (JSON)]
    Uploads[Bilder, Profilbilder, Thumbnails]
  end

  UI --> Express
  Express --> Services
  Services --> Data
  Services --> Uploads
```

---

## 🧩 Kernfunktionen

### 🔗 **Linkmanager**
- Übersichtliche Kachelansicht für Kategorien und Links  
- Benutzerdefinierte Farben je Kategorie oder Link  
- Spätere Erweiterung: Verwaltung über die Oberfläche  
- Responsive Design  

### 📸 **Foto-Server**
- Rollenbasierter Zugriff (z. B. „Fotos-A“, „Fotos-B“)  
- Upload- und Anzeige-Funktion mit Thumbnails  
- Struktur in Unterordnern  
- Drag & Drop-Upload  
- Vorschau und Downloadoption  

### 🎮 **Minecraft-Server-Verwaltung**
- Anzeige von Serverstatus (Online/Offline, IP, Spielerzahl)  
- Starten/Stoppen von Servern (nur für „Minecraft Admins“)  
- Integration mehrerer Instanzen (z. B. Forge, Paper)  

### 🔐 **Vaultwarden-Integration**
- Anzeige der Serverinformationen (Domain, Port, API-Status)  
- Keine SSO-Integration, aber zentrale Info-Kachel  

### ⚙️ **Admin-Oberfläche (LAN-only)**
- Verwaltung von Benutzern, Rollen und Konfiguration  
- Zugriff nur aus dem lokalen Netzwerk  

---

## 🧱 Architektur

- **Backend:** Node.js mit Express  
- **Frontend:** EJS (serverseitige Templates), HTML, CSS, JS  
- **Datenhaltung:** JSON-Dateien, optional später NoSQL (MongoDB o. ä.)  
- **Authentifizierung:** Session-basiert, mit optionaler 2FA  
- **Betrieb:** Raspberry Pi 5 (16 GB empfohlen) oder Heimserver  
- **Zugriff:** HTTPS über lokale Domain (z. B. `morja.local`) oder DynDNS  

---

## 🧩 Module im Detail

### 1️⃣ **Linkmanager**
- Anzeige von Kategorien & Links in Kachelform  
- Farben können vom Benutzer angepasst werden  
- JSON-basierte Datenhaltung  
- Erweiterbar für Drag & Drop oder Verwaltung per Webinterface  

### 2️⃣ **Foto-Server**
- Speicherung in `/public/uploads/photos/<Rolle>/...`  
- Unterordner pro Benutzergruppe  
- JSON-Datei verwaltet Metadaten (Dateiname, Uploader, Timestamp)  
- Zugriff über Rollenprüfung  

### 3️⃣ **Minecraft-Server**
- Abfrage des Serverstatus über `minecraft-server-util`  
- Anzeige von Online-Status und Spielerzahl  
- Start-/Stop-Optionen über Button (nur Adminrolle)  

### 4️⃣ **Vaultwarden**
- Anzeige von Verbindungsinformationen (Server, Port, API)  
- Zugriff nur für Benutzer mit „Vaultwarden“-Rolle  

### 5️⃣ **Adminbereich**
- Nur lokal (LAN) erreichbar  
- Hinzufügen, Bearbeiten und Löschen von Benutzern  
- Rollenmanagement  

---

## 👥 Benutzer- & Rollensystem

| Rolle | Beschreibung | 2FA |
|--------|---------------|-----|
| **Linkmanager** | Zugriff auf den Linkmanager | ❌ |
| **Fotos-A / Fotos-B** | Zugriff auf jeweilige Foto-Ordner | ✅ |
| **Minecraft** | Zugriff auf Serverstatus | ❌ |
| **Minecraft Admin** | Starten/Stoppen der Server (WAN erlaubt) | ✅ |
| **Vaultwarden** | Zugriff auf Vaultwarden-Kachel | ✅ |
| **Admin** | Zugriff auf Adminseite (LAN-only) | ✅ |

---

## 🔐 Zwei-Faktor-Authentifizierung (2FA)

- Implementierung über TOTP (kompatibel mit Microsoft Authenticator, Authy, etc.)
- Aktivierung erfolgt in der Profilseite
- Nach Einrichtung sind 2FA-geschützte Dienste nur mit Code zugänglich
- Benutzer sieht bei nicht aktivierter 2FA eine Hinweis-Kachel mit QR-Code & Setup-Info

---

## 💾 Datenhaltung

Alle Daten werden lokal im JSON-Format gespeichert.

### Beispielstruktur
```
data/
├── users/
│   ├── alex.json
│   ├── mark.json
│   └── ...
├── photos/
│   ├── photos_A.json
│   ├── photos_B.json
│   └── ...
├── minecraft/servers.json
├── vaultwarden/config.json
└── config/system.json
```

### Benutzerdatei (`data/users/alex.json`)
```
{
  "email": "alex@example.com",
  "passwordHash": "...",
  "roles": ["Linkmanager", "Fotos-A"],
  "theme": "dark",
  "accentColor": "#4a90e2",
  "categories": [
    {
      "id": "Private_Alex",
      "name": "Privat",
      "links": [
        { "title": "GitHub", "url": "https://github.com/" }
      ]
    }
  ]
}
```

---

## 🧩 Projektstruktur

```
morjaHome/
├── server.js
├── package.json
│
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   ├── utils/
│   └── config/
│
├── views/
│   ├── layout.ejs
│   ├── index.ejs
│   ├── profile.ejs
│   ├── manage.ejs
│   ├── admin.ejs
│   ├── photos.ejs
│   └── partials/
│
├── public/
│   ├── css/
│   ├── js/
│   ├── icons/
│   └── uploads/
│
└── data/
    ├── users/
    ├── photos/
    ├── minecraft/
    ├── vaultwarden/
    └── config/
```

---

## 🎨 UI & Designkonzept

### Grundprinzipien
- Kachelbasiertes, responsives Dashboard  
- Light- & Darkmode  
- Akzentfarben individuell pro Benutzer, Kategorie und Kachel  
- Farberbfolge: **Kachel → Kategorie → Benutzer → Standard**  
- Einheitlicher Stil mit Schatten, runden Ecken und sanften Animationen  

### Hauptbereiche
- **Dashboard:** Übersicht über alle Module  
- **Profil:** 2FA, Rollenübersicht, Profilbild, Farbanpassung  
- **Fotos:** Galerie-Ansicht mit Drag & Drop Upload  
- **Admin:** Benutzerverwaltung (nur LAN)  

---

## ⚙️ Erweiterung & Skalierung

### Skalierbarkeit
- Läuft performant auf Raspberry Pi 5 (8–16 GB empfohlen)  
- Nutzung von JSON-Dateien für bis zu 20 aktive Benutzer problemlos  
- Möglichkeit, später auf Datenbank (MongoDB o. ä.) zu migrieren  

### Sicherheit
- Rollenbasiertes Zugriffssystem  
- Trennung zwischen LAN- und WAN-Zugriff  
- 2FA für sensible Bereiche  
- Upload-Validierung und MIME-Type-Prüfung  

---

## 🧰 Technologien

| Kategorie | Technologie |
|------------|-------------|
| **Server** | Node.js + Express |
| **Frontend** | EJS, HTML, CSS, JavaScript |
| **Datenhaltung** | JSON (lokal) |
| **Auth** | Express-Session + bcrypt + TOTP |
| **Minecraft** | minecraft-server-util |
| **Hosting** | Raspberry Pi 5 / Linux / Docker |
| **Design** | Eigenes CSS (+ Tailwind Option) |

---

## 🚀 Zukünftige Erweiterungen

| Erweiterung | Beschreibung |
|--------------|---------------|
| 🔐 Single-Sign-On | SSO zwischen MorjaHome und Vaultwarden |
| ☁️ Cloud Sync | Synchronisierung von Links & Daten via Nextcloud / WebDAV |
| 🖼️ Foto-Favoriten | Markierung und Download als ZIP |
| 📊 Statistik-Dashboard | Anzeige von Nutzungsdaten (z. B. Server Uptime) |
| 🧱 Plugin-System | Eigene Module integrieren (z. B. Kalender, Notizen) |

---

## 📄 Lizenz

Privates Projekt, nicht für kommerzielle Nutzung.  
Erstellt mit ❤️ von **MorjaHome Community**.

---
