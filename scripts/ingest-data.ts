import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

import { CustomPDFLoader } from '@/utils/customPDFLoader';
=======
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { Chroma } from 'langchain/vectorstores/chroma';
import { COLLECTION_NAME } from '@/config/chroma';

/* Name of directory to retrieve your files from 
   Make sure to add your PDF files inside the 'docs' folder
*/
const filePath = 'docs';

export const run = async () => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PDFLoader(path),
    });

    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();

    let chroma = new Chroma(embeddings, { collectionName: COLLECTION_NAME });
    await chroma.index?.reset();

    // Ingest documents in batches of 100

    for (let i = 0; i < docs.length; i += 100) {
      const batch = docs.slice(i, i + 100);
      await Chroma.fromDocuments(batch, embeddings, {
        collectionName: COLLECTION_NAME,
      });
    }
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();
