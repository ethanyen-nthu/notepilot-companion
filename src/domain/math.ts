import katex from 'katex';
export function mathParts(text: string) {
  return text
    .split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g)
    .filter(Boolean)
    .map((part) => {
      const math = part.startsWith('$') && part.endsWith('$');
      const source = math ? part.replace(/^\$\$?|\$\$?$/g, '') : part;
      return {
        source,
        html: math
          ? katex.renderToString(source, {
              output: 'mathml',
              displayMode: true,
              throwOnError: false,
              trust: false,
              strict: 'error',
              maxExpand: 100,
              maxSize: 10,
            })
          : null,
      };
    });
}
