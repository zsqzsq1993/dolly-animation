#!/usr/bin/env sh

set -e

echo "Please enter new version:"

read -r VERSION

read -p "Releasing $VERSION, Are you sure? (y/n)" -n 1 -r

echo

if [[ $REPLY =~ ^[Yy]$ ]]

then
  echo "Releasing version $VERSION..."

  git add .

  git commit -m "[build] $VERSION"

  npm version $VERSION --message "[release] $VERSION"

  git push origin master

  npm publish

fi
