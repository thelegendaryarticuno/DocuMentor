/**
 * Document parser for PDF and DOCX files
 * Extracts text content for analysis
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedDocument {
  text: string;
  filename: string;
  type: 'pdf' | 'docx';
  pageCount?: number;
}

/**
 * Parse PDF file and extract text
 */
async function parsePDF(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  return {
    text: fullText.trim(),
    filename: file.name,
    type: 'pdf',
    pageCount: pdf.numPages,
  };
}

/**
 * Parse DOCX file and extract text
 */
async function parseDOCX(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  return {
    text: result.value.trim(),
    filename: file.name,
    type: 'docx',
  };
}

/**
 * Parse document file (PDF or DOCX)
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return parsePDF(file);
  } else if (extension === 'docx' || extension === 'doc') {
    return parseDOCX(file);
  } else {
    throw new Error('Unsupported file type. Please upload PDF or DOCX files only.');
  }
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks with max token limit
 */
export function chunkText(text: string, maxTokens: number = 800): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  let currentTokens = 0;
  
  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);
    
    if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
      // Save current chunk and start new one
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentTokens = sentenceTokens;
    } else {
      currentChunk += sentence;
      currentTokens += sentenceTokens;
    }
  }
  
  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Store chunks in session storage
 */
export function storeChunks(documentId: string, chunks: string[]): void {
  const chunkData = {
    chunks,
    timestamp: Date.now(),
    totalChunks: chunks.length,
  };
  sessionStorage.setItem(`doc_chunks_${documentId}`, JSON.stringify(chunkData));
}

/**
 * Retrieve chunks from session storage
 */
export function retrieveChunks(documentId: string): string[] | null {
  const data = sessionStorage.getItem(`doc_chunks_${documentId}`);
  if (!data) return null;
  
  const parsed = JSON.parse(data);
  return parsed.chunks;
}

/**
 * Clear document chunks from session storage
 */
export function clearChunks(documentId: string): void {
  sessionStorage.removeItem(`doc_chunks_${documentId}`);
}
