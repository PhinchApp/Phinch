import { remote } from 'electron';
import { join } from 'path';
import fs from 'fs';

const { dialog } = remote;
const serializer = new XMLSerializer();

export default function handleExportButton(path, svg, callback, visType) {
  const filename = path.split('/').pop();
  const name = filename.split('.').shift();
  const pathWithoutFilename = path.replace(filename, '');
  dialog.showSaveDialog({
    defaultPath: join(pathWithoutFilename, `${name}-${visType}.svg`),
  }, (filepath) => {
    if (filepath) {
      const serializedSVG = serializer.serializeToString(svg);
      fs.writeFileSync(filepath, serializedSVG);
    }
    callback();
  });
}
