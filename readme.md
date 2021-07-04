[![Version](https://img.shields.io/npm/v/httpdir.svg)](https://github.com/johansatge/httpdir/releases)
[![Downloads](https://img.shields.io/npm/dm/httpdir.svg)](https://www.pkgstats.com/pkg:httpdir)
[![Last commit](https://badgen.net/github/last-commit/johansatge/httpdir)](https://github.com/johansatge/httpdir/commits/master)
[![Install Size](https://badgen.net/packagephobia/install/httpdir)](https://packagephobia.com/result?p=httpdir)

![Icon](icon.png)

> Simple, zero dependency command-line HTTP server for static local files

---

* [Installation](#installation)
* [Usage](#usage)
* [Changelog](#changelog)
* [License](#license)

## Installation

_This module needs Node `>=12`._

Install with [npm](https://www.npmjs.com/):

```bash
$ npm install httpdir --global
```

## Usage

```bash
httpdir <path> <port>
```

Example:

```bash
# This will start a local server on port `8090`, with `~/Desktop` as root directory
httpdir ~/Desktop 8090
```

Default path is `.`, default port is `8080`.

## Changelog

This project uses [semver](http://semver.org/).

| Version | Date | Notes |
| --- | --- | --- |
| `1.0.1` | 2021-07-04 | Fix execution issue on Unix |
| `1.0.0` | 2021-07-04 | Initial version |

## License

This project is released under the [MIT License](license.md).
