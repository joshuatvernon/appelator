# 🖋️ Appelator

A quick and dirty CLI tool for finding available NPM package names

## Setup

Install `appelator` as a global NPM CLI tool
```sh
λ npm i appelator -g
```

Find all taken and available NPM package names
```sh
λ appelator --find
```

Optionall save taken and available NPM package names to an external `.json` file
```sh
λ appelator --save [directory]
```

## Search

Output a random available NPM package name
```sh
λ appelator --random
Found 1 available NPM package names:

graybeard
```

Output available NPM package names matching a query string
```sh
λ appelator --query dog
Found 10 available NPM package names:

bumblepuppy
puppy
puppydom
puppyfish
puppyfoot
puppyhood
puppyish
puppyism
puppylike
puppysnatch
```

# Filtering

Use `--limit` to output a specific number of available NPM packages
```sh
λ appelator --query dog --limit 3
Found 3 available NPM package names:

albedograph
amidogen
amidoguaiacol
```

Use `--exact` to output only available NPM packages of a specific length
```sh
appelator --query puppy --exact 8
Found 3 available NPM package names:

puppydom
puppyish
puppyism
```

Use `--min` to output only available NPM packages of a specific length
```sh
λ appelator --query puppy --min 9
Found 6 available NPM package names:

bumblepuppy
puppyfish
puppyfoot
puppyhood
puppylike
puppysnatch
```

Use `--max` to output only available NPM packages of a specific length
```sh
λ appelator --query puppy --max 8
Found 4 available NPM package names:

puppy
puppydom
puppyish
puppyism
```

NOTE: `--limit`, `--exact`, `--min`, and `--max` can all be used with `--random` and `---queryuery`

### Help

```sh
λ appelator --help

  Usage: appelator [options]

  Options:

    -V, --version          output the version number
    -f --find              find available and taken npm package names
    -s --save [directory]  save available and taken npm package names to .json file in directory
    -r --random            get random available npm package name (note: use limit to get more than one)
    -q --query [query]     get available npm package name with matching query string
    -l --limit [limit]     limits number of available names to return
    -e --exact [exact]     get available names of an exact length -- overrides min or max
    -m --min [min]         get available names higher than or equal to a specific length
    -M --max [max]         get available names lower than or equal to a specific length
    -h, --help             output usage information
```
