![VizGallery](https://raw.githubusercontent.com/shujianbu/Phinch/master/viz_gallery.png)

## About

[![Join the chat at https://gitter.im/Phinch2/Lobby](https://badges.gitter.im/Phinch2/Lobby.svg)](https://gitter.im/Phinch2/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[Phinch](http://phinch.org/) is an open-source framework for visualizing biological data, funded by a grant from the [Alfred P. Sloan foundation](http://www.sloan.org/). This project represents an interdisciplinary collaboration between [Pitch Interactive](http://www.pitchinteractive.com/beta/index.php), a data visualization studio in Oakland, CA, and biological researchers at [UC Davis](http://www.ucdavis.edu/). Whether it's genes, proteins, or microbial species, Phinch provides an interactive visualization tool that allows users to explore and manipulate large biological datasets.

## Install

First, clone the repo via git:

```bash
git clone https://github.com/PhinchApp/Phinch.git your-project-name
```

Then install dependencies with yarn or `npm install`.

```bash
$ cd phinch
$ yarn
```

You'll also need to install hdf5 in order to be able to load hdf5 biom files. You can obtain it from the [HDF Group](https://www.hdfgroup.org/downloads/hdf5/), or from a package manager like brew:

```bash
$ brew install hdf5
```

Finally, here's *the tricky part*. Phinch uses a python script in the  `biomhandler` folder to load hdf5 biom files. To make Phinch easy to install, we use PyInstaller to package that script into a standablone executable. Follow these steps to generate the executable:

```bash
cd biomhandler
virtualenv ./virtualenv
source ./virtualenv/bin/activate
cat requirements.txt | xargs -n 1 -L 1 pip install
pyinstaller biomhandler.spec
```

## Run

```bash
$ npm run dev
```

## Good to Know

Phinch's performance will depend on your system, but in general large biom files may take time to load. Files with a large number of selected samples (more than `500`) may be sluggish in the filter and visualization views. Please be patient when working with large files, or consider pre-filtering your data for visualization.

## Packaging

Package apps for the local platform with:

```bash
$ npm run package
```

## Mozilla Global Sprint: Round 5 of Mozilla Open Leaders

![Mozilla](/512px-Mozilla_logo.svg.png)

[Mozilla Open Leaders information](https://mozilla.github.io/leadership-training/round-5/projects/)

## Code of Conduct

Check out our [Code of Conduct](/CONDUCT.md)

## Contribution Guidelines

Check out our [Contribution Guidelines](/CONTRIBUTING.md)

## License
The BSD 2-Clause License
