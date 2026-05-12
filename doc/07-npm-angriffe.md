# Analyse realer npm-Supply-Chain-Angriffe

Dieses Kapitel untersucht reale, öffentlich dokumentierte Supply-Chain-Angriffe im
npm-Ökosystem. Ziel ist nicht eine vollständige Chronologie aller Vorfälle, sondern die
Identifikation typischer Angriffsmuster, Taktiken, Techniken und Risikofaktoren, die für
Unternehmen relevant sind.

## Untersuchungsgegenstand

Ausgewählt werden Fälle mit klarem Bezug zu npm oder JavaScript/Node.js, ausreichender
technischer Dokumentation und nachvollziehbaren Auswirkungen auf Entwicklungs-, Build- oder
Produktionsumgebungen. Fälle aus anderen Package-Ökosystemen werden nur berücksichtigt, wenn
sie zur Einordnung eines allgemeinen Supply-Chain-Musters beitragen.

## Analysevorlage pro Angriff

Für jeden untersuchten Fall wird dieselbe Struktur verwendet:

1. Kurzbeschreibung des Angriffs.
2. Betroffene Pakete und Ökosystembereiche.
3. Angriffsvektor und technische Vorgehensweise.
4. Auswirkungen auf Entwicklungs- oder Produktionsumgebungen.
5. Erkennungs- und Präventionsmöglichkeiten.
6. Relevanz für BKW und vergleichbare Unternehmen.

## Muster und Risikofaktoren

Die Analyse betrachtet insbesondere folgende Muster:

1. Kompromittierte Maintainer-Accounts.
2. Bösartige Maintainer oder gezielt platzierte Schadpakete.
3. Typosquatting und Dependency Confusion.
4. Manipulierte Build-, Install- oder Publish-Prozesse.
5. Exfiltration von Secrets aus Entwicklungs- oder CI/CD-Umgebungen.
6. Ausführung von Schadcode während Installation, Build oder Test.

TODO: Konkrete Fälle auswählen, analysieren und die beobachteten Muster mit Quellen belegen.
