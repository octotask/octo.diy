import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditorStore } from './editor';
import type { FilesStore } from './files';
import type { MapStore } from 'nanostores';

// Mock a complete FilesStore
const createMockFilesStore = (): FilesStore => {
  const files = {
    get: vi.fn(),
    set: vi.fn(),
    setKey: vi.fn(),
    listen: vi.fn(),
    subscribe: vi.fn(),
    lc: 0,
    off: vi.fn(),
    value: undefined,
  } as unknown as MapStore<any>;

  return {
    getFile: vi.fn(),
    files,
    filesCount: 0,
    lockFile: vi.fn(),
    unlockFile: vi.fn(),
    lockFolder: vi.fn(),
    unlockFolder: vi.fn(),
    isFileLocked: vi.fn(),
    isFolderLocked: vi.fn(),
    isFileInLockedFolder: vi.fn(),
    getFileOrFolder: vi.fn(),
    getFileModifications: vi.fn(),
    getModifiedFiles: vi.fn(),
    resetFileModifications: vi.fn(),
    saveFile: vi.fn(),
    createFile: vi.fn(),
    createFolder: vi.fn(),
    deleteFile: vi.fn(),
    deleteFolder: vi.fn(),
  } as unknown as FilesStore;
};

describe('EditorStore', () => {
  let editorStore: EditorStore;
  let mockFilesStore: FilesStore;
  const mockHot = { data: {} } as any;

  beforeEach(() => {
    mockFilesStore = createMockFilesStore();
    editorStore = new EditorStore(mockFilesStore, mockHot);
  });

  it('should apply an insertion patch correctly', () => {
    const filePath = 'test.js';
    const originalContent = 'hello world';
    const newContent = 'hello beautiful world';

    editorStore.documents.setKey(filePath, { value: originalContent, filePath, isBinary: false });
    (mockFilesStore.getFile as vi.Mock).mockReturnValue({ isLocked: false });

    editorStore.updateFile(filePath, newContent);

    const updatedDocument = editorStore.documents.get()[filePath];
    expect(updatedDocument?.value).toBe(newContent);
  });

  it('should apply a deletion patch correctly', () => {
    const filePath = 'test.js';
    const originalContent = 'hello beautiful world';
    const newContent = 'hello world';

    editorStore.documents.setKey(filePath, { value: originalContent, filePath, isBinary: false });
    (mockFilesStore.getFile as vi.Mock).mockReturnValue({ isLocked: false });

    editorStore.updateFile(filePath, newContent);

    const updatedDocument = editorStore.documents.get()[filePath];
    expect(updatedDocument?.value).toBe(newContent);
  });

  it('should apply a modification patch correctly', () => {
    const filePath = 'test.js';
    const originalContent = 'hello world';
    const newContent = 'goodbye world';

    editorStore.documents.setKey(filePath, { value: originalContent, filePath, isBinary: false });
    (mockFilesStore.getFile as vi.Mock).mockReturnValue({ isLocked: false });

    editorStore.updateFile(filePath, newContent);

    const updatedDocument = editorStore.documents.get()[filePath];
    expect(updatedDocument?.value).toBe(newContent);
  });

  it('should not update a locked file', () => {
    const filePath = 'test.js';
    const originalContent = 'hello world';
    const newContent = 'goodbye world';

    editorStore.documents.setKey(filePath, { value: originalContent, filePath, isBinary: false });
    (mockFilesStore.getFile as vi.Mock).mockReturnValue({ isLocked: true });

    editorStore.updateFile(filePath, newContent);

    const updatedDocument = editorStore.documents.get()[filePath];
    expect(updatedDocument?.value).toBe(originalContent);
  });
});
