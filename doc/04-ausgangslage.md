# Ausgangslage

Moderne Softwareentwicklung basiert überwiegend auf Open-Source-Komponenten. Studien zeigen,
dass in typischen Applikationen oft 80–90 % des Codes aus externen Bibliotheken und Frameworks
stammt, während der selbst geschriebene Anteil meist nur einen kleinen Teil ausmacht.

Entwickler integrieren täglich Pakete aus Registries wie npm, PyPI oder Maven Central, inklusive
vieler transitive Dependencies, die nur indirekt kontrollierbar sind.

Diese starke Wiederverwendung führt zu Effizienzgewinnen, verlagert jedoch einen wesentlichen
Teil der Sicherheits- und Wartungsverantwortung auf externe Maintainer. Dadurch entstehen neue
Risiken im Bereich Software Supply Chain Security, insbesondere durch verwundbare oder
kompromittierte Pakete sowie fehlende Transparenz über Abhängigkeiten.

Als Reaktion auf diese Problematik fordern regulatorische Vorgaben und industrielle Standards
eine höhere Transparenz in Software-Lieferketten. Ein zentrales Instrument hierfür ist die
Software Bill of Materials (SBOM), die eine strukturierte Auflistung aller verwendeten
Software-Komponenten und deren Abhängigkeiten ermöglicht. Regulatorische Initiativen wie die
US Executive Order 14028 zur Verbesserung der Cybersicherheit – auf deren Grundlage das National
Institute of Standards and Technology Richtlinien wie das Secure Software Development Framework
entwickelt hat – sowie der Cyber Resilience Act erhöhen die Anforderungen an Transparenz,
Nachvollziehbarkeit und Schwachstellenmanagement entlang der Software-Lieferkette. Ergänzend
treiben Industrieinitiativen wie die OpenSSF mit Ansätzen wie SLSA die Standardisierung von
Build-Provenance und die Absicherung von Software-Artefakten voran.

Im Bereich Application Security bei BKW gewinnt dieses Thema zunehmend an Bedeutung. Dabei ist
Transparenz in Software-Lieferketten jedoch keine eigenständige Lösung, sondern eine grundlegende
Voraussetzung, um Risiken überhaupt sichtbar und bewertbar zu machen.
