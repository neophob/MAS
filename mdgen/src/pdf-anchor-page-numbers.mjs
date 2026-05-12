import fs from "node:fs/promises";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRef,
  PDFString
} from "pdf-lib";

export async function resolvePdfAnchorPageNumbers(pdfPath) {
  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const pageRefToNumber = new Map(pages.map((page, index) => [page.ref.toString(), index + 1]));
  const result = new Map();

  collectDestinationDictionary({
    pdfDoc,
    pageRefToNumber,
    result,
    dictionary: pdfDoc.context.lookup(pdfDoc.catalog.get(PDFName.of("Dests")))
  });

  const names = pdfDoc.context.lookup(pdfDoc.catalog.get(PDFName.of("Names")));
  if (names instanceof PDFDict) {
    collectNamesTree({
      pdfDoc,
      pageRefToNumber,
      result,
      tree: names.get(PDFName.of("Dests"))
    });
  }

  return result;
}

function collectDestinationDictionary({ pdfDoc, pageRefToNumber, result, dictionary }) {
  if (!(dictionary instanceof PDFDict)) {
    return;
  }

  for (const key of dictionary.keys()) {
    const name = decodePdfName(key);
    const pageNumber = pageNumberFromDestination({
      pdfDoc,
      pageRefToNumber,
      destination: dictionary.get(key)
    });

    if (name && pageNumber) {
      result.set(name, pageNumber);
    }
  }
}

function collectNamesTree({ pdfDoc, pageRefToNumber, result, tree }) {
  const dictionary = pdfDoc.context.lookup(tree);
  if (!(dictionary instanceof PDFDict)) {
    return;
  }

  const names = pdfDoc.context.lookup(dictionary.get(PDFName.of("Names")));
  if (names instanceof PDFArray) {
    for (let index = 0; index < names.size() - 1; index += 2) {
      const name = decodePdfString(pdfDoc.context.lookup(names.get(index)));
      const pageNumber = pageNumberFromDestination({
        pdfDoc,
        pageRefToNumber,
        destination: names.get(index + 1)
      });

      if (name && pageNumber) {
        result.set(name, pageNumber);
      }
    }
  }

  const kids = pdfDoc.context.lookup(dictionary.get(PDFName.of("Kids")));
  if (kids instanceof PDFArray) {
    for (let index = 0; index < kids.size(); index += 1) {
      collectNamesTree({
        pdfDoc,
        pageRefToNumber,
        result,
        tree: kids.get(index)
      });
    }
  }
}

function pageNumberFromDestination({ pdfDoc, pageRefToNumber, destination }) {
  const resolved = pdfDoc.context.lookup(destination);
  if (!(resolved instanceof PDFArray) || resolved.size() === 0) {
    return undefined;
  }

  const pageRefOrDict = resolved.get(0);
  if (pageRefOrDict instanceof PDFRef) {
    return pageRefToNumber.get(pageRefOrDict.toString());
  }

  const pageDictionary = pdfDoc.context.lookup(pageRefOrDict);
  const pageIndex = pdfDoc.getPages().findIndex((page) => page.node === pageDictionary);
  return pageIndex >= 0 ? pageIndex + 1 : undefined;
}

function decodePdfName(value) {
  if (!(value instanceof PDFName)) {
    return undefined;
  }

  return value.asString().replace(/^\//, "");
}

function decodePdfString(value) {
  if (value instanceof PDFString || value instanceof PDFHexString) {
    return value.decodeText();
  }

  return undefined;
}
