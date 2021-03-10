This directory contains files generated before builds and before tests. These files enable us to 'bake in' variables from during the build process into the built files. This means our cicd pipelines will be able to inject variables into the build when creating artifacts.

At the current time this is only needed for our app to be able to display version and commit hash.

See the file 'generate-files.js' in the root of the project to see which files are generated and which variables are used.

Note: For the version, we could import it from the package.json, but we are not currently using the package.json to keep track of our versioning.
