import { atom, computed, map, type MapStore, type WritableAtom, type ReadableAtom } from 'nanostores';
import type { EditorDocument, ScrollPosition } from '~/components/editor/codemirror/CodeMirrorEditor';
import type { FileMap, FilesStore } from './files';
import { createScopedLogger } from '~/utils/logger';
import { diff_match_patch } from 'diff-match-patch';

export type EditorDocuments = Record<string, EditorDocument>;

type SelectedFile = WritableAtom<string | undefined>;

const logger = createScopedLogger('EditorStore');

export class EditorStore {
  #filesStore: FilesStore;

  selectedFile: SelectedFile;
  documents: MapStore<EditorDocuments>;
  currentDocument: ReadableAtom<EditorDocument | undefined>;

  constructor(filesStore: FilesStore, hot: ImportMeta['hot'] = import.meta.hot) {
    this.#filesStore = filesStore;

    this.selectedFile = hot?.data.selectedFile ?? atom<string | undefined>();
    this.documents = hot?.data.documents ?? map({});

    this.currentDocument = computed([this.documents, this.selectedFile], (documents, selectedFile) => {
      if (!selectedFile) {
        return undefined;
      }

      return documents[selectedFile];
    });

    if (hot) {
      hot.data.documents = this.documents;
      hot.data.selectedFile = this.selectedFile;
    }
  }

  setDocuments(files: FileMap) {
    const previousDocuments = this.documents.value;

    this.documents.set(
      Object.fromEntries<EditorDocument>(
        Object.entries(files)
          .map(([filePath, dirent]) => {
            if (dirent === undefined || dirent.type !== 'file') {
              return undefined;
            }

            const previousDocument = previousDocuments?.[filePath];

            return [
              filePath,
              {
                value: dirent.content,
                filePath,
                isBinary: dirent.isBinary,
                scroll: previousDocument?.scroll,
              },
            ] as [string, EditorDocument];
          })
          .filter(Boolean) as Array<[string, EditorDocument]>,
      ),
    );
  }

  setSelectedFile(filePath: string | undefined) {
    this.selectedFile.set(filePath);
  }

  updateScrollPosition(filePath: string, position: ScrollPosition) {
    const documents = this.documents.get();
    const documentState = documents[filePath];

    if (!documentState) {
      return;
    }

    this.documents.setKey(filePath, {
      ...documentState,
      scroll: position,
    });
  }

  updateFile(filePath: string, newContent: string) {
    const documents = this.documents.get();
    const documentState = documents[filePath];

    if (!documentState) {
      return;
    }

    // Check if the file is locked by getting the file from the filesStore
    const file = this.#filesStore.getFile(filePath);

    if (file?.isLocked) {
      logger.warn(`Attempted to update locked file: ${filePath}`);
      return;
    }

    const currentContent = documentState.value;
    const contentChanged = currentContent !== newContent;

    if (contentChanged) {
      const dmp = new diff_match_patch();
      const diff = dmp.diff_main(currentContent, newContent);
      dmp.diff_cleanupSemantic(diff);

      const patches = dmp.patch_make(diff);
      const [patchedContent] = dmp.patch_apply(patches, currentContent);

      this.documents.setKey(filePath, {
        ...documentState,
        value: patchedContent,
      });
    }
  }
}
