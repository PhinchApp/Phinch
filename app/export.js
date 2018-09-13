import { remote } from 'electron';
import { join } from 'path';
import fs from 'fs';

const { dialog } = remote;
const serializer = new XMLSerializer();

export function handleExportButton(path, svg, callback) {
  dialog.showSaveDialog({
    defaultPath: join(...path, `${path.slice(-1)}.svg`),
  }, (filepath) => {
    if (filepath) {
      const serializedSVG = serializer.serializeToString(svg);
      fs.writeFileSync(filepath, serializedSVG);
    }
    callback();
  });
}
