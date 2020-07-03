# rustdocusaurus github action

This will let you run this script as a Github Action.

```yml
    - name: run rustdocusaurus
      uses: tauri-apps/rustdocusaurus/github-action@master
      with:
        originPath: ./tauri/target/docs/
        targetPath: ./tauri-docs/docs/api/rust/
        sidebarPath: ./tauri-docs/sidebars.json
        linksRoot: /docs/api/rust/
        cratesToProcess: "tauri,tauri_api,tauri_utils"
```

## updating

This code is prebuilt using `ncc`. After you make a code change, run `yarn build` to run the script to update the `dist` directory.
