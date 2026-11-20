// Service Worker für Push-Benachrichtigungen (Firebase Cloud Messaging)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB3Ofoi0ZJqhkTjbbbQ_ehh94D3WckjuS8",
  authDomain: "sgso-teamplaner-dcf68.firebaseapp.com",
  projectId: "sgso-teamplaner-dcf68",
  storageBucket: "sgso-teamplaner-dcf68.firebasestorage.app",
  messagingSenderId: "962812663769",
  appId: "1:962812663769:web:beb11c4f529e26e2d02bc8"
});

// Mitteilungen mit "notification"-Inhalt zeigt Firebase im Hintergrund selbst an.
firebase.messaging();

// Tippen auf die Mitteilung öffnet die App: Das übernimmt Firebase über webpush.fcmOptions.link.
