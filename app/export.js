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
      const serializedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${serializer.serializeToString(svg)}`;
      fs.writeFileSync(filepath, serializedSVG);
    }
    callback();
  });
}
