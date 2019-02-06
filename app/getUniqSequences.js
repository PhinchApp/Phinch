import _sortBy from 'lodash.sortby';

export default function getUniqSequences(data) {
  // takes in columns / samples and returns unique sequences
  // performance intensive with larger datasets
  return _sortBy([...new Set([]
    .concat(...data.map(d => []
      .concat(...d.matches.map(s => []
        .concat(...s.taxonomy.map((t, k) => {
          const taxa = [];
          let j = 0;
          while (j <= k) {
            taxa.push(s.taxonomy[j]);
            j += 1;
          }
          return taxa.join();
        })))))))]);
  // .sort((a, b) => { // sort to make adjacent less likely to be equal
  //   return this.readsBySequence[b] - this.readsBySequence[a];
  // });
}
