// Modified from https://github.com/mozilla/pdf.js/blob/master/examples/components/simpleviewer.js

/* Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';

import 'pdfjs-dist/legacy/web/pdf_viewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const CMAP_URL = 'pdfjs-dist/cmaps/';
const CMAP_PACKED = true;

const ENABLE_XFA = true;

export const addResizeObserver = (container: HTMLDivElement, callback: () => void) => {

  const observer = new ResizeObserver(() => {
    callback();
  });

  observer.observe(container);

  return () => {
    observer.disconnect();
  }

}

export const createPDFViewer = (
  container: HTMLDivElement,
  pdfURL: string,
) => new Promise<{ viewer: pdfjsViewer.PDFViewer, viewerElement: HTMLDivElement }>((resolve, reject) => {
  // Container needs a DIV child - cf:
  // https://github.com/mozilla/pdf.js/blob/master/examples/components/simpleviewer.html
  const viewerElement = document.createElement('div');
  viewerElement.className = 'pdfViewer';

  container.appendChild(viewerElement);

  const eventBus = new pdfjsViewer.EventBus();

  // Enable hyperlinks within PDF files.
  const pdfLinkService = new pdfjsViewer.PDFLinkService({ eventBus });

  // (Optionally) enable find controller.
  const pdfFindController = new pdfjsViewer.PDFFindController({
    eventBus,
    linkService: pdfLinkService,
  });

  const viewer = new pdfjsViewer.PDFViewer({
    container,
    eventBus,
    linkService: pdfLinkService,
    findController: pdfFindController
  });

  pdfLinkService.setViewer(viewer);

  pdfjsLib.getDocument({
    url: pdfURL,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    enableXfa: ENABLE_XFA
  }).promise.then(pdfDocument => {
    viewer.setDocument(pdfDocument);
    pdfLinkService.setDocument(pdfDocument);
  }).catch(error => reject(error));

  eventBus.on('pagesinit', () => {    
    // Default to scale = auto
    viewer.currentScaleValue = 'auto';

    // Listen to the first 'textlayerrendered' event (once)
    const onInit = () => {
      resolve({ viewer, viewerElement });
      eventBus.off('textlayerrendered', onInit);
    }

    eventBus.on('textlayerrendered', onInit);  
  });
});