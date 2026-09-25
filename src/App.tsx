import { useCallback, useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { RulePanel } from './components/RulePanel';
import { ResultPane } from './components/ResultPane';
import { Toolbar } from './components/Toolbar';
import { useLocalRules } from './hooks/useLocalRules';
import { useRegexPipeline } from './hooks/useRegexPipeline';
import type { FileMeta } from './types';

const MAX_WARN_BYTES = 10 * 1024 * 1024;

export default function App() {
  const {
    rules,
    rulesLoading,
    rulesSource,
    rulesLoadError,
    updateRule,
    setMatchCounts,
    clearMatchCounts,
    exportRules,
    importRules,
    resetRules,
    reloadFromPy,
  } = useLocalRules();

  const { isRunning, canRun, result, runError, hasExecuted, run, setRunError } =
    useRegexPipeline(rules, updateRule, setMatchCounts, clearMatchCounts);

  const [source, setSource] = useState('');
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const onFileLoaded = useCallback((content: string, meta: FileMeta) => {
    setSource(content);
    setFileMeta(meta);
    setImportError(null);
    setRunError(null);
  }, [setRunError]);

  const onClearFile = useCallback(() => {
    setFileMeta(null);
  }, []);

  const onImport = useCallback(
    async (file: File) => {
      try {
        await importRules(file);
        setImportError(null);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : '규칙 가져오기에 실패했습니다.',
        );
      }
    },
    [importRules],
  );

  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-3 p-3">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-800">
          Regex Sequential Processor
        </h1>
        <Toolbar
          onExport={exportRules}
          onImport={onImport}
          onReset={resetRules}
          onReloadPy={reloadFromPy}
          rulesLoading={rulesLoading}
        />
      </header>

      <FileUploader
        fileMeta={fileMeta}
        oversized={Boolean(fileMeta && fileMeta.size > MAX_WARN_BYTES)}
        onFileLoaded={onFileLoaded}
        onClear={onClearFile}
        error={importError}
      />

      <RulePanel
        rules={rules}
        onChange={updateRule}
        onRun={() => run(source)}
        canRun={canRun}
        isRunning={isRunning}
        rulesLoading={rulesLoading}
        rulesSource={rulesSource}
        rulesLoadError={rulesLoadError}
      />

      <ResultPane
        source={source}
        onSourceChange={setSource}
        sourceReadOnly={fileMeta !== null}
        fileMeta={fileMeta}
        result={result}
        hasExecuted={hasExecuted}
        runError={runError}
      />
    </div>
  );
}
