# Problemstellung und Zielsetzung

## Problemstellung

Viele Unternehmen verfügen über kein strukturiertes Software Lifecycle Management für ihre
Open-Source-Abhängigkeiten. Sicherheitsupdates werden häufig verspätet oder manuell
durchgeführt, wodurch Risiken durch bekannte Schwachstellen entstehen.

Gleichzeitig kann die schnelle Übernahme neuer Package-Releases ebenfalls gefährlich sein:
Unternehmen riskieren, kompromittierte und/oder bösartige Pakete zu installieren, bevor diese als
schädlich erkannt werden. Dadurch können Entwicklungs- und Produktionsumgebungen kompromittiert
werden.

Die zentrale Fragestellung lautet:

Wie können Unternehmen Sicherheitsrisiken durch Open-Source-Abhängigkeiten minimieren und
gleichzeitig effiziente, automatisierte Update-Prozesse gewährleisten?

## Zielsetzung

Die Arbeit untersucht, wie Unternehmen Risiken durch Open-Source-Abhängigkeiten im
npm-Ökosystem reduzieren und gleichzeitig effiziente sowie sichere Update-Prozesse etablieren
können.

Im Fokus stehen dabei typische Angriffsmuster in Software Supply Chains sowie technische und
organisatorische Massnahmen zur Absicherung von Dependency-Management-Prozessen.

Die Arbeit verfolgt folgende Ziele:

- Analyse aktueller Supply-Chain-Bedrohungen im npm-Ökosystem sowie Identifikation typischer
  Angriffsmuster, Taktiken und Risikofaktoren für Unternehmen.
- Untersuchung automatisierter Dependency-Update-Prozesse als Sicherheitsmassnahme,
  insbesondere für Patch- und Minor-Updates mithilfe von Renovate.
- Evaluation des Potenzials AI-assistierter Ansätze zur Unterstützung von Major Dependency
  Updates.
- Einordnung etablierter Frameworks und Best Practices wie SLSA und S2C2F hinsichtlich ihres
  Beitrags zur Absicherung von Software Supply Chains.
- Ableitung von Handlungsempfehlungen für einen sicheren Umgang mit Open-Source-Abhängigkeiten
  im Unternehmenskontext.

## Deliverables

- Analyse typischer Angriffsmuster im npm-Ökosystem.
- Bewertung automatisierter Dependency-Update-Strategien.
- Proof of Concept einer AI-assistierten Unterstützung von Dependency-Updates.
- Einordnung von SLSA und S2C2F als Referenzrahmen für sichere Software Supply Chains.
- Handlungsempfehlungen und Best Practices für Unternehmen.

## Abgrenzung

Die Arbeit fokussiert sich auf das öffentliche npm-Ökosystem. Nicht Bestandteil der Arbeit sind:

- andere Package Registries (PyPI, Maven etc.)
- Entwicklung eigener Security Tools
- tiefgehendes Malware Reverse Engineering
- rechtliche Fragestellungen
- vollständige Unternehmensimplementierungen
