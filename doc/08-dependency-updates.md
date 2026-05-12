# Automatisierte Dependency-Update-Prozesse

Automatisierte Dependency Updates sind ein zentraler Baustein, um bekannte Schwachstellen in
Open-Source-Abhängigkeiten zeitnah zu beheben. Gleichzeitig müssen sie kontrolliert erfolgen,
damit neue Versionen nicht unbemerkt funktionale Regressionen oder Supply-Chain-Risiken
einführen.

## Patch- und Minor-Updates mit Renovate

Für Patch- und Minor-Updates wird Renovate als Referenzwerkzeug untersucht. Betrachtet werden
Konfiguration, Update-Gruppierung, Scheduling, Pull-Request-Erzeugung, CI-Integration,
Auto-Merge-Regeln und Review-Prozesse.

TODO: Konkretes Testprojekt, Renovate-Konfiguration und beobachtete Update Pull Requests
dokumentieren.

## Sicherheitsrelevante Konfiguration

Sicherheitsrelevante Guardrails umfassen mindestens:

1. Lockfiles und reproduzierbare Installationen.
2. CI-Signale für Tests, Build und statische Prüfungen.
3. Branch Protection und Review-Regeln.
4. Getrennte Behandlung von Security Updates und regulären Updates.
5. Zeitliche Steuerung von Updates und Pull-Request-Gruppierung.
6. Klare Auto-Merge-Regeln für risikoarme Updates.
7. Nachvollziehbare Änderungs- und Freigabeprozesse.

## Bewertung

Die Bewertung erfolgt anhand der Kriterien Sicherheitsgewinn, Transparenz, Wartbarkeit,
Umsetzbarkeit und operativer Aufwand.

TODO: Nach dem Proof of Concept bewerten, unter welchen Bedingungen automatisierte
Patch- und Minor-Updates vertretbar automatisiert werden können.
