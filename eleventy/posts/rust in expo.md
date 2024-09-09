---
title: Expo with Rust
tags: post
---

# Expo with Rust

React Native + Rust with Expo and UniFFI

## Motivation

Skip to [Step-by-step](#step-by-step) if you [want the meat and you want it raw](https://youtu.be/4Wd09hi2Pug).

I wrote this because I could not find anyone else who's done this on the internet.
And this wouldn't be a good recipe page without me telling you my life story first.

This all began with the desire to add encryption to my overengineered shopping list/notes app to protect users from myself when sharing data through my server. I searched for solutions but [Expo-"Crypto"](https://docs.expo.dev/versions/latest/sdk/crypto/) only supports hashing functions and the [SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) API is not available in the Hermes JS engine. So I decided to use the platform native cryptography APIs in Kotlin and Swift powered by an Expo Module.
However I gave up 90% through the Kotlin implementiation of an [ECIES](https://cryptobook.nakov.com/asymmetric-key-ciphers/ecies-public-key-encryption) encryption function as it was really frustrating to develop Kotlin in the Expo module because I was not familiar with the Kotlin tool ecosystem and had to blindly first-time develop Kotlin without any autocomplete, suggestions or other IDE tooling like errors and warnings before compilation (skill issue). This is probably easily solvable for more experienced developers in this field but I was not invested enough to find out as I wanted to get it done quickly. Developing with cryptographic functions was hard enough as this field is riddled with cryptic TLAs and every ecosystem comes with its own interpretation on how to expose them in the best way.
The straw that finally broke the camel's back was when I could not control the format in which a public key was exported. And throughout the whole process I was already eyeing Rust. I am more familiar with Rust and the tooling is a bliss compared to the skill issues I had with Kotlin. So when I realized I had to write a manual implementiation for exporting a public key in a foreign language with all the quirks that come with the API exposing the public key (insert rant about Java/Kotlin having a weird understanding of bytes and the EC public key having weird number of bytes) I decided that it would take the same amount of effort to get Rust running. Rust would also have the added benefit that I could use it in iOS and Android and other exciting project ideas using [OpenMLS]() and [Automerge](). Then I'd only need to maintain Swift and Kotlin glue code. From some previous quick online search I knew it was _theoretically_ possible use it.

So I dug deeper. From my previous work on the Kotlin implementation I knew that ideally I wanted to pass and return byte arrays from and to my encryption function. Passing `UInt8Array`s from JS to Swifts `Data` and Kotlins `ByteArray` was already handled well by Expo and React Native. What was left for me was to pass the data from Swift/Kotlin to Rusts `Vec<u8>` (so many names for bytes). The existing examples on the internet sadly only used simple data types like integers and I encountered another skill issue in passing complex data like a byte array through the C FFI layer of Rust. In one of my attempts I managed to pass the data on Android using the JNA and JNI library to handle the conversion but I failed on iOS as I didn't have these utilites for Swift. I used Safe-FFI but found no explanation on how to generate their C Vector represenation in Swift to pass through FFI to Rust. I assumed I needed to get the pointer to the data and it's length + capacity and pass those into the C struct to reconstruct it in Rust to a Rust Vector but without Swift knowledge nor any C skills I gave up on that. My past experience is in higher level languages before I learned Rust so my understanding of lower languages like C is only basic and theoretical. In the future I want to get better at my FFI and C understanding but that needed to wait for another day to not get completely sidetracked. A huge help was the [Expo Rust demo](https://github.com/dgca/expo-rust-demo) by Daniel Cortes. Many of the parts below and in the repository are based on it like the scripts for automating these steps below. But this example too had the problem of only presenting a basic add function example with numbers using Rust's C FFI. This is where Mozilla's UniFFI comes into play and allowed me in my third attempt to pass byte arrays. It handles generating all the binding code to pass byte arrays for you.

Leftovers:
There are examples on the internet on how to use iOS/Android + UniFFI and Expo + Rust but none with Expo + UniFFI so I created this article.
Downsides

- Additional complexity
- More copying and allocation of data when passing between layers

Doing it manually would take as long as finding out how to integrate Rust, a more familiar language and ecosystem I had good experiences with. I'll spare the rant about Kotlin/Java weird understanding of bytes and the EC key having an odd number of bytes.
I tried to use the platform native cryptography libraries in an Expo module but gave up on an almost done Kotlin implementation. I because I became frustrated that I could not control the format of the exported public key.
This is based on the [work by Daniel Cortes](https://github.com/dgca/expo-rust-demo)

<!-- TODO reference Crux -->

## Prequisites

### Add rust targets

#### Android

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

#### iOS

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim
```

## Install cargo-ndk for Android

```bash
cargo install cargo-ndk
```

<!-- #TODO swiftformat and kotlinlint (format) -->

# Swiftformat and kotlinlint

You might want to add those too.

## Step-by-step

1. Create expo project

   ```bash
   npx create-expo-app -t expo-template-blank-typescript third-time
   ```

   And change directory to the newly created project

   ```bash
   cd third-time
   ```

   Optionally, run the app to test if everything works.

2. Create local expo module
   ```bash
   npx create-expo-module my-rust-module --local
   ```
   This will be our native code for the specific platform that acts as glue to call the Rust code. It gets called by React Native to call the Rust code.
3. Create Rust project

   ```bash
   cargo new --lib native_rust
   ```

4. Add UniFFI dependency to `native_rust/Cargo.toml` as build and normal dependency

   ```bash
   cd native_rust
   cargo add uniffi
   cargo add --build uniffi --features build
   ```

   `native_rust/Cargo.toml` should now contain something like this

   ```toml
   [dependencies]
   uniffi = "0.27.1"

   [build-dependencies]
   uniffi = { version = "0.27.1", features = ["build"] }
   ```

5. Set crate type to `cdylib` for Android and `staticlib` for iOS in `native_rust/Cargo.toml`

   ```toml
   [lib]
   crate-type = ["staticlib", "cdylib"]
   ```

6. Add native_rust/src/math.udl

   ```udl
   namespace math {
      i32 add(i32 a, i32 b);
   };
   ```

   This is the definition for the Rust API we want to make available. It helps UniFFI to identify what APIs are available and generate the necessary bindings.

   You can see that it uses signed 32-bit integers. I chose this because from my experience Java and therefore Kotlin is a bit weird with unsigned integers and it's a topic I don't want to get into right now. I might try unsigned integers again at some point but for now it is like this.

7. Add `native_rust/build.rs`

   ```rust
   fn main() {
       uniffi::generate_scaffolding("src/math.udl").unwrap();
   }
   ```

   This generates the UniFFI scaffolding Rust code based on the math.udl from the step before.

   The code is put out into the Rust build script `OUT_DIR` (build time environment variable). You don't have to worry about what that is but if you are itnerested, you can find out the path for this variable with a tool like [cargo-out-dir](https://crates.io/crates/cargo-out-dir). If we didn't do this step we would have to run the scaffold manually through the UniFFI CLI.

8. Update `native_rust/src/lib.rs`

   ```rust
   pub fn add(left: i32, right: i32) -> i32 {
       left + right
   }
   uniffi::include_scaffolding!("math");
   ```

   This updates the library code to match the math.udl definition. The macro in the last line then includes the bindings code generated at build time from the `OUT_DIR` as described in the last step.

9. Add UniFFI CLI binary

   Add binary compile option to `native_rust/Cargo.toml`

   ```toml
   [[bin]]
   name = "uniffi-bindgen"
   path = "uniffi-bindgen.rs"
   ```

   Add the `native_rust/uniffi-bindgen.rs` file

   ```rust
   fn main() {
       uniffi::uniffi_bindgen_main()
   }
   ```

   This step allows us to call the UniFFI CLI to generate Swift and Kotlin bindings through our Rust project when it is compiled as a binary and not as a library.
   If you don't really get it, trust me I don't get it either. It has something to do with not being able to call the UniFFI CLI directly as one of our dependencies or this only being possible in Rust nightly. See the [UniFFI book](https://mozilla.github.io/uniffi-rs/tutorial/foreign_language_bindings.html) for their explanation.

10. Generate native platform projects

```bash
npx expo prebuild
```

These are required to use native code with our expo project as we can not use Expo Go anymore. See the Expo documentation for details.

If the android project does not compile when you try to run it (`npx expo run:android`) after prebuild, try to open it in Android Studio.

```bash
open -a "/Applications/Android Studio.app" ./android
```

This happens on my system for every new Expo project but Android Studio seems to sort it out somehow. Definitely a point to look into in the future.

### Android

1. Compile Rust code for Android

   ```bash
   cargo ndk --target aarch64-linux-android --platform 21 -- build --release --lib
   ```

   Notice the `--platform` argument. I think it might be important to be set to the
   minimum SDK version (21 in this case) of the `modules/my-rust-module/android/build.gradle` file. This might have been an error I made in previous attempts. So if your app crashes after starting on Android without giving you any indication to what might have happened think about this.

   Also add `--lib` to compile the project as library as opposed to binary that runs the UniFFI CLI.

   This step needs to be repeated for every target platform your app should run on. We only target `aarch64-linux-android` in this example for simplicity. I recommend automating lots of this later.

1. Generate Kotlin bindings

   ```bash
   cargo run --features=uniffi/cli --bin uniffi-bindgen generate --library target/aarch64-linux-android/release/libnative_rust.so --language kotlin --out-dir generated/kotlin
   ```

   Now we run our Rust project as binary to use the UniFFI CLI (see `--bin`). This generates the Kotlin bindings code.

1. Create directories to for the compiled Rust library for Android

   ```bash
   mkdir -p modules/my-rust-module/android/src/main/jniLibs/arm64-v8a
   ```

   As with the compile step. This would need to be repeated for all other targets with the following target mapping to directory:

   - aarch64-linux-android -> arm64-v8a
   - armv7-linux-androideabi -> armeabi-v7a
   - i686-linux-android -> x86
   - x86_64-linux-android -> x86_64

1. Copy the compiled `.so` file from `target/aarch64-linux-android/release` to the jniLibs directory

   ```bash
   cp native_rust/target/aarch64-linux-android/release/libnative_rust.so modules/my-rust-module/android/src/main/jniLibs/arm64-v8a/libnative_rust.so
   ```

1. Copy generated Kotlin bindings to the Android project

   ```bash
   cp -r generated/kotlin/uniffi modules/my-rust-module/android/src/main/java/uniffi
   ```

1. Add JNA dependency to `modules/my-rust-module/android/build.gradle`

   ```groovy
   dependencies {
     //...
     implementation "net.java.dev.jna:jna:5.13.0@aar"
   }
   ```

   The generated UniFFI bindings need this dependency.

1. Add import to bindings in `modules/my-rust-module/android/src/main/java/expo/modules/myrustmodule/MyRustModule.kt`

   ```kotlin
   import uniffi.math.add
   ```

1. Update code in `modules/my-rust-module/android/src/main/java/expo/modules/myrustmodule/MyRustModule.kt` to use Rust function

   ```kotlin
   Function("hello") {
     val result = add(3, 4)
     "Hello world! 👋 $result"
   }
   ```

### iOS

The same as Android but simpler

1. Compile Rust code for iOS

   ```bash
   cargo build --release --target aarch64-apple-ios-sim --lib
   ```

   Or without `-sim` if targeting a reall iOS device

1. Generate Swift bindings

   ```bash
   cargo run --features=uniffi/cli --bin uniffi-bindgen generate --library target/aarch64-apple-ios-sim/release/libnative_rust_lib.dylib --out-dir generated/swift/ --language swift
   ```

1. Generate rust subdirectory

   ```bash
   mkdir modules/my-rust-module/ios/rust
   ```

   This is just for organizing the generated artifacts in the ios directory.

1. Copy the compiled `.a` file to the iOS project

   ```bash
   cp native_rust/target/aarch64-apple-ios-sim/release/libnative_rust.a modules/my-rust-module/ios/rust/
   ```

1. Copy the generated Swift bindings to the iOS project

   ```bash
   cp -r native_rust/generated/ modules/my-rust-module/ios/rust
   ```

   Notice the / after generated. It is important to copy the contents of the
   generated directory and not the directory itself.

1. Update `modules/my-rust-module/ios/MyRustModule.podspec` to include the Rust library

   ```ruby
   s.vendored_libraries = 'rust/libnative_rust.a'
   ```

1. Update the podfile (from the root directory)

   ```bash
   pod install --project-directory=ios
   ```

1. Change the code in `modules/my-rust-module/ios/MyRustModule.swift` to use the Rust function

   ```swift
   Function("hello") {
      let result = add(a: 1, b: 2)
      return "Hello world! 👋 \(result)"
   }
   ```

   Fun fact, you don't need to add an import in Swift for the function in `math.swift`
