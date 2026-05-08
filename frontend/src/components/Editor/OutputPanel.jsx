
import { useEditor } from '../../context/EditorContext';
import { Terminal, XCircle, CheckCircle, Clock, X } from 'lucide-react';

const OutputPanel = () => {
  const { output, isExecuting } = useEditor();

  const getOutputContent = () => {
    if (!output) return '';
    
    if (typeof output === 'string') {
      return output;
    }
    
    if (typeof output === 'object') {
      if (output.error) {
        return typeof output.error === 'string' 
          ? output.error 
          : JSON.stringify(output.error, null, 2);
      }
      
      if (output.output !== undefined) {
        return typeof output.output === 'string'
          ? output.output
          : JSON.stringify(output.output, null, 2);
      }
      
      return JSON.stringify(output, null, 2);
    }
    
    return String(output);
  };

  const hasError = () => {
    if (!output) return false;
    
    if (typeof output === 'object') {
      return output.error !== null && output.error !== undefined && output.error !== '';
    }
    
    return false;
  };

  const getExecutionTime = () => {
    if (!output || typeof output !== 'object') return null;
    return output.executionTime || null;
  };

  const getExitCode = () => {
    if (!output || typeof output !== 'object') return null;
    return output.exitCode !== undefined ? output.exitCode : null;
  };

  const outputContent = getOutputContent();
  const isError = hasError();
  const executionTime = getExecutionTime();
  const exitCode = getExitCode();

  return (
    <div className="flex h-full flex-col bg-[#0f1013] text-white">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#15171c] px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-300" />
          <span className="text-sm font-medium">Output</span>
          
          {isExecuting && (
            <div className="ml-4 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-300"></div>
              <span className="text-xs text-amber-300">Executing...</span>
            </div>
          )}
          
          {!isExecuting && outputContent && (
            <div className="ml-4 flex items-center gap-2">
              {isError ? (
                <>
                  <XCircle className="h-4 w-4 text-red-300" />
                  <span className="text-xs text-red-300">Error</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  <span className="text-xs text-emerald-300">Success</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400">
          {executionTime !== null && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{executionTime}ms</span>
            </div>
          )}
          
          {exitCode !== null && (
            <div className="flex items-center space-x-1">
              <span className={exitCode === 0 ? 'text-emerald-300' : 'text-red-300'}>
                Exit: {exitCode}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0b0c0f] p-4 font-mono text-sm">
        {isExecuting ? (
          <div className="flex h-full flex-col items-center justify-center text-zinc-500">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400"></div>
            <p>Executing code...</p>
          </div>
        ) : outputContent ? (
          <pre className={`whitespace-pre-wrap break-words ${isError ? 'text-red-300' : 'text-zinc-300'}`}>
            {outputContent}
          </pre>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-zinc-500">
            <Terminal className="mb-4 h-12 w-12 opacity-50" />
            <p>No output yet</p>
            <p className="text-xs mt-2">Run your code to see the output here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
