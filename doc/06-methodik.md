# Methodik

Dieses Kapitel beschreibt das methodische Vorgehen der Arbeit. Ziel ist nicht, die inhaltlichen
Ergebnisse vorwegzunehmen, sondern die Nachvollziehbarkeit der Analyse, der Bewertung und des
Proof of Concept sicherzustellen.

Die Arbeit verwendet einen explorativen und praxisorientierten Ansatz. Sie kombiniert eine
Literatur- und Threat-Intelligence-Analyse, die Untersuchung realer npm-Supply-Chain-Angriffe,
die Bewertung automatisierter Dependency-Update-Prozesse und einen Proof of Concept für
AI-assistierte Major Dependency Updates.

## Forschungsdesign

Das Forschungsdesign besteht aus fünf aufeinander aufbauenden Schritten:

1. Grundlagen und Referenzrahmen werden anhand von Fachliteratur, Standards, Frameworks und
   Herstellerdokumentationen aufgearbeitet.
2. Reale npm-Supply-Chain-Angriffe werden als Fallstudien analysiert und nach wiederkehrenden
   Angriffsmustern, Taktiken, Techniken und Risikofaktoren untersucht.
3. Automatisierte Dependency-Update-Prozesse werden mit Fokus auf Patch- und Minor-Updates
   betrachtet. Renovate dient dabei als Referenzwerkzeug für die praktische Einordnung.
4. Major Dependency Updates werden separat betrachtet, weil sie typischerweise mehr
   Kontextwissen, Codeanpassungen und Review-Aufwand benötigen. Für diesen Teil wird ein
   Proof of Concept mit AI-Unterstützung erstellt.
5. Die Erkenntnisse werden gegen etablierte Frameworks und Best Practices wie SLSA, S2C2F,
   SSDF und SBOM eingeordnet und zu Handlungsempfehlungen verdichtet.

Der Ansatz ist qualitativ. Die Arbeit erhebt keinen Anspruch auf eine statistisch repräsentative
Messung aller npm-Angriffe. Entscheidend ist, ob die untersuchten Fälle und technischen
Experimente nachvollziehbare Muster, Risiken und praktikable Gegenmassnahmen sichtbar machen.

## Datengrundlage und Quellen

Die Datengrundlage setzt sich aus öffentlich verfügbaren Quellen zusammen. Verwendet werden
insbesondere:

1. Berichte zu realen Supply-Chain-Angriffen im npm-Ökosystem.
2. Security Advisories, Vulnerability-Datenbanken und Threat-Intelligence-Berichte.
3. Dokumentationen von Werkzeugen wie npm, Renovate und relevanten CI/CD-Plattformen.
4. Referenzrahmen und Best Practices von Organisationen wie OpenSSF, OWASP, NIST und CNCF.
5. Artefakte aus dem Proof of Concept, zum Beispiel Konfigurationen, Pull Requests, Testresultate,
   Changelogs und Review-Notizen.

Quellen werden berücksichtigt, wenn sie öffentlich zugänglich, nachvollziehbar, thematisch relevant
und ausreichend konkret sind. Für die Analyse realer Angriffe werden Fälle priorisiert, die einen
klaren Bezug zu npm oder JavaScript/Node.js haben und bei denen genügend technische Details zur
Angriffsweise, Auswirkung und Erkennung verfügbar sind.

Nicht berücksichtigt werden Fälle, die nur anekdotisch beschrieben sind, keinen Bezug zum
Untersuchungsgegenstand haben oder keine belastbare technische Einordnung erlauben. Andere
Package-Ökosysteme wie PyPI oder Maven werden nur herangezogen, wenn sie als Vergleich oder zur
Einordnung allgemeiner Supply-Chain-Muster notwendig sind.

## Analyseverfahren

Die Analyse realer npm-Angriffe erfolgt anhand einer einheitlichen Vorlage. Pro Fall werden
Kurzbeschreibung, betroffene Pakete, Angriffsvektor, technische Vorgehensweise, mögliche
Auswirkungen, Erkennungs- und Präventionsmöglichkeiten sowie die Relevanz für Unternehmen
dokumentiert.

Die identifizierten Angriffsmuster werden qualitativ klassifiziert. Dabei werden insbesondere
folgende Aspekte betrachtet:

1. Einstiegspunkt des Angriffs, zum Beispiel Account-Kompromittierung, bösartiger Maintainer,
   Dependency Confusion, Typosquatting oder kompromittierte Build-/Publish-Prozesse.
2. Betroffene Phase der Software Supply Chain, zum Beispiel Entwicklung, Build, Distribution,
   Installation oder Betrieb.
3. Mögliche Auswirkungen auf Unternehmen, zum Beispiel Credential Theft, Manipulation von
   Build-Artefakten, Exfiltration von Geheimnissen oder Ausführung beliebigen Codes.
4. Erkennbarkeit durch bestehende Kontrollen wie Lockfiles, CI-Signale, Dependency-Scanning,
   SBOM, Provenance-Informationen oder manuelle Reviews.
5. Geeignete Gegenmassnahmen und deren Grenzen.

Automatisierte Update-Strategien und Frameworks werden anhand qualitativer Kriterien bewertet.
Die Kriterien orientieren sich an der Forschungsfrage und umfassen Sicherheitsgewinn,
Transparenz, Wartbarkeit, Umsetzbarkeit, operativen Aufwand und Risiko unbeabsichtigter
Nebenwirkungen. Die Bewertung dient nicht als mathematisches Scoring-Modell, sondern als
strukturierte Entscheidungsgrundlage für die späteren Handlungsempfehlungen.

## Proof-of-Concept-Vorgehen

Der Proof of Concept untersucht, wie automatisierte und AI-assistierte Dependency Updates in
einem kontrollierten Setup unterstützt werden können. Als Untersuchungsobjekt wird ein
repräsentatives npm-/Node.js-Projekt verwendet. Das Projekt muss automatisierte Tests, ein
Lockfile und mehrere direkte sowie transitive Dependencies enthalten, damit typische
Update-Situationen realistisch abgebildet werden können.

Für Patch- und Minor-Updates wird Renovate als Referenzwerkzeug eingesetzt. Betrachtet werden
Konfiguration, Update-Gruppierung, Scheduling, Pull-Request-Erzeugung, CI-Integration,
Auto-Merge-Regeln und notwendige Guardrails. Ziel ist zu prüfen, unter welchen Bedingungen
solche Updates weitgehend automatisiert und trotzdem kontrollierbar durchgeführt werden können.

Für Major Updates wird AI-Unterstützung separat untersucht. Dabei wird dokumentiert, welche
Arbeitsschritte sinnvoll unterstützt werden können, zum Beispiel Analyse von Release Notes,
Identifikation von Breaking Changes, Anpassung betroffener Code-Stellen, Interpretation
fehlgeschlagener Tests oder Erstellung eines Review-Vorschlags. Jeder AI-gestützte Schritt wird
so dokumentiert, dass nachvollziehbar bleibt, welche Eingaben verwendet wurden, welche
Änderungen vorgeschlagen wurden und welche manuelle Prüfung notwendig war.

Im Proof of Concept werden mindestens folgende Artefakte festgehalten:

1. Ausgangszustand des Projekts inklusive relevanter Dependencies und Testabdeckung.
2. Renovate-Konfiguration und generierte Update Pull Requests.
3. Beschreibung der ausgewählten Major-Update-Szenarien.
4. AI-Interaktionen, erzeugte Änderungsvorschläge und manuelle Korrekturen.
5. Testresultate vor und nach den Updates.
6. Einschätzung von Review-Aufwand, Reproduzierbarkeit und verbleibendem Risiko.

Der Proof of Concept ist kein Produktiv-Rollout und keine vollständige Unternehmensimplementierung.
Er dient dazu, technische Möglichkeiten und Grenzen sichtbar zu machen. Die Ergebnisse werden
deshalb als Entscheidungsgrundlage interpretiert und nicht als allgemeingültiger Nachweis, dass ein
bestimmtes Werkzeug oder Vorgehen in jeder Umgebung gleich gut funktioniert.

## Gütekriterien und Grenzen

Die Nachvollziehbarkeit der Arbeit wird durch einheitliche Analysevorlagen, dokumentierte
Quellen, reproduzierbare Konfigurationen und explizite Bewertungskriterien unterstützt. Aussagen
zu Angriffsmustern und Gegenmassnahmen werden nach Möglichkeit mit mehreren Quellen oder mit
Artefakten aus dem Proof of Concept abgestützt.

Die Arbeit bleibt bewusst begrenzt. Sie fokussiert auf das öffentliche npm-Ökosystem und auf
Dependency-Management-Prozesse. Nicht Teil der Methodik sind tiefgehendes Malware Reverse
Engineering, die Entwicklung eigener Security-Werkzeuge, eine rechtliche Bewertung oder eine
vollständige Einführung in einer Unternehmensumgebung.
