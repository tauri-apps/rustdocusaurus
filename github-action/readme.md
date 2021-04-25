# rustdocusaurus github action

This will let you run this script as a Github Action. The following are the required options.

```yml
    - name: run rustdocusaurus
      uses: tauri-apps/rustdocusaurus/github-action@master
      with:
        originPath: ./tauri/target/docs/
        targetPath: ./tauri-docs/docs/api/rust/
        sidebarPath: ./tauri-docs/sidebars.json
        linksRoot: /docs/api/rust/
        cratesToProcess: "tauri"
```

- `originPath` is the folder containing rustdoc generated files, "/path/to/tauri/target/doc/"
- `targetPath` the "rust" directory in tauri-docs, it contains the resulting MDX, "path/to/tauri-docs/docs/api/rust/"
- `sidebarPath` the sidebars.json file we want to read/write, it lives at the root of tauri-docs, "/path/to/tauri-docs/sidebars.json"
- `linksRoot` can remain as is for now: "/docs/api/rust/", it's the root URI used for creating the HTML links
- `cratesToProcess` a list of crates to process; after cargo doc, you have folders in the  tauri/target/doc directory: these are the resulting docs for each crate. This is a comma separated list.

## updating

This code is prebuilt using `ncc`. After you make a code change, run `yarn build` to run the script to update the `dist` directory.
