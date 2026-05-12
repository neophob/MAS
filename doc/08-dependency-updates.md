# Automatisierte Dependency-Update-Prozesse

Automatisierte Dependency Updates sind ein zentraler Baustein, um bekannte Schwachstellen in
Open-Source-Abhängigkeiten zeitnah zu beheben. Gleichzeitig dürfen neue Versionen nicht
unkontrolliert übernommen werden, weil auch aktuelle Releases kompromittiert sein oder
funktionale Regressionen auslösen können.

## Renovate als Referenzwerkzeug

Die BKW setzt Renovate ein, um Software-Abhängigkeiten automatisiert aktuell zu halten.
Renovate erkennt verwendete Bibliotheken, Images und Tools, zum Beispiel npm-Pakete,
Python-Pakete, Maven-Dependencies oder Docker-Images. In regelmässigen Läufen prüft Renovate,
ob neue Versionen verfügbar sind, und erstellt bei Bedarf Pull Requests mit den notwendigen
Änderungen.

Für diese Arbeit dient Renovate als Referenzwerkzeug, weil es mehrere Paketökosysteme
unterstützt, gut konfigurierbar ist und sich in bestehende CI/CD-Prozesse integrieren lässt.
Wichtige Funktionen sind Scheduling, Update-Gruppierung, zentrale Presets, Labels,
Automerge-Regeln und ein Dependency Dashboard.

Renovate ersetzt keine technische Validierung. Es erstellt die Änderung, aber die Entscheidung,
ob ein Update sicher übernommen werden kann, hängt von Pipeline, Tests, Review-Regeln und
Sicherheitskontrollen ab.

## Updateklassen

Die Update-Strategie orientiert sich an semantischer Versionierung:

- Patch-Updates enthalten typischerweise Fehlerbehebungen ohne API-Änderung.
- Minor-Updates enthalten typischerweise neue, abwärtskompatible Funktionen.
- Major-Updates können inkompatible Änderungen enthalten und benötigen deshalb mehr Prüfung.

Daraus ergibt sich eine pragmatische Grundregel: Patch- und Minor-Updates können stärker
automatisiert werden, wenn CI und Tests stabil sind. Major-Updates sollen zwar automatisch als
Pull Request erstellt, aber nicht automatisch gemerged werden.

## Betriebsmodell

Renovate wird über eine JSON-Konfiguration gesteuert. Diese legt fest, welche Paketquellen
geprüft werden, wann Renovate läuft, wie Updates gruppiert werden und unter welchen Bedingungen
ein Pull Request automatisch zusammengeführt werden darf.

Bei der BKW läuft Renovate regelmässig in einer Azure-DevOps-Pipeline. Ein typischer Ablauf ist:

1. Renovate scannt das Repository und erkennt verwendete Dependencies.
2. Renovate prüft, ob neue Versionen verfügbar sind.
3. Renovate erstellt pro Update oder Update-Gruppe einen Pull Request.
4. Die Pipeline validiert die Änderung mit Build, Tests und weiteren Checks.
5. Der Pull Request wird je nach Risiko und Konfiguration automatisch oder manuell gemerged.

Ein internes Beispiel ist das Selbstupdate des Renovate Docker Images. Renovate erkennt dabei
einen neuen Renovate-Release und erstellt einen Pull Request für das aktualisierte Dockerfile. Im
nächsten Lauf kann dieses aktualisierte Image von der Pipeline verwendet werden. Dadurch bleibt
auch die Update-Infrastruktur selbst nachvollziehbar aktualisiert.

## Technische Mindestanforderungen

Automatisches Mergen ist nur sinnvoll, wenn das Projekt genügend technische Leitplanken hat:

- Einheitliches Branchingkonzept und klare Branch-Namen.
- CI/CD-Pipeline für Pull Requests.
- Automatisierte Tests, mindestens Build- und Unit-Tests; je nach Projekt auch Integrationstests.
- Branch Protection oder vergleichbare Regeln, damit nur erfolgreiche Checks gemerged werden.
- Lockfiles oder andere Mechanismen für reproduzierbare Installationen.
- Schreibrechte für den Renovate Bot, damit Branches und Pull Requests erstellt werden können.

Ohne diese Voraussetzungen kann Renovate trotzdem für Monitoring und Pull-Request-Erstellung
eingesetzt werden. Der Merge sollte dann manuell bleiben.

## Sicherheitsrelevante Konfiguration

Für Patch- und Minor-Updates kann Automerge eingesetzt werden, wenn alle definierten Checks
erfolgreich sind. Zusätzlich ist ein Wartefenster sinnvoll: Mit `minimumReleaseAge` kann Renovate
so konfiguriert werden, dass neue Releases erst nach einigen Tagen übernommen werden. Ein
Wartefenster von drei Tagen reduziert das Risiko, sehr frische kompromittierte Releases sofort zu
installieren.

Major-Updates sollten nicht automatisch gemerged werden. Sinnvoll sind Labels wie
`major-update` oder `needs-review`, verpflichtende Reviewer und zusätzliche Prüfungen. Dazu
gehören Release Notes, Breaking Changes, Testresultate und bei Bedarf SCA- oder statische
Analysen wie Dependency-Scanning, CodeQL, SonarQube oder vergleichbare Tools.

## Bewertung

Renovate reduziert manuellen Wartungsaufwand und kann bekannte Schwachstellen schneller in den
normalen Entwicklungsprozess bringen. Der Sicherheitsgewinn entsteht aber erst durch die
Kombination aus regelmässigen Updates, stabiler CI, klaren Automerge-Regeln und manueller
Kontrolle bei risikoreichen Änderungen.

Für diese Arbeit ist Renovate deshalb kein alleiniger Schutzmechanismus, sondern ein Baustein
eines kontrollierten Dependency-Management-Prozesses.
