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

import type { PDFAnnotatorOptions } from './pdf-annotator-options';

import 'pdfjs-dist/legacy/web/pdf_viewer.css';

const CMAP_URL = 'pdfjs-dist/cmaps/';
const CMAP_PACKED = true;

const ENABLE_XFA = true;

export const createPDFViewer = (
  container: HTMLDivElement,
  pdfURL: string,
  opts: PDFAnnotatorOptions
) => new Promise<{ 
  viewer: pdfjsViewer.PDFViewer, 
  viewerElement: HTMLDivElement,
  destroy: () => Promise<void>;
}>((resolve, reject) => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = opts.workerSrc || '/pdf.worker.min.mjs';

  const wasmUrl = opts.wasmUrl || '/';

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

  const loadingTask = pdfjsLib.getDocument({
    url: pdfURL,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    enableXfa: ENABLE_XFA,
    wasmUrl
  });

  // Listen to the first 'textlayerrendered' event (once)
  const onInit = () => {
    resolve({ viewer, viewerElement, destroy });
    eventBus.off('textlayerrendered', onInit);
  }

  const onPagesInit = () => {
    // Default to scale = auto
    viewer.currentScaleValue = 'auto';
    eventBus.on('textlayerrendered', onInit, { once: true });  
  }

  let destroyed = false;

  const destroy = async () => {
    if (destroyed) return Promise.resolve();
    destroyed = true;
    
    eventBus.off('pagesinit', onPagesInit);
    eventBus.off('textlayerrendered', onInit);

    try {
      viewer.setDocument(null as any); 
      pdfLinkService.setDocument(null);
      viewer.cleanup();
    } finally {
      try {
        await loadingTask.destroy();
      } finally {
        viewerElement.remove();
      }
    }
  }
  
  eventBus.on('pagesinit', onPagesInit);

  loadingTask.promise.then(pdfDocument => {
    if (destroyed) return;
    viewer.setDocument(pdfDocument);
    pdfLinkService.setDocument(pdfDocument);
  }).catch(error => {
    destroy();
    reject(error);
  });
});