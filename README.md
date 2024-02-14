# Bug-Hunter: NodeJS error reporting & cluster monitoring service

[![Version npm](https://img.shields.io/npm/v/bug-hunter.svg?logo=npm)](https://www.npmjs.com/package/bug-hunter)

> **:fire:Attention!**
> -----------------------------------------------
> I'm working hard to release version **1.0.0** with numerous features like realtime logs streaming, system performance & network monitoring, etc. please let me know if you encounter any issues or glitches in the meantime.

Bug-Hunter is a robust error reporting & cluster monitoring solution tailored for Node.js applications. It seamlessly captures uncaught exceptions, providing in-depth insights through detailed error stacks and contextual code snippets. With configurable reporting options, including email and logging, Bug-Hunter ensures effective monitoring and prompt debugging for enhanced application stability.

## Table Of Contents
- [Features](#features)
- [ToDo](#todo)
- [Comparison with pm2](#bug-hunter-vs-pm2-plus-monitoring-service)
- [Anatomy](#anatomy)
  - [Web Component](#web-component)
  - [Package Component](#package-component)
- [Before You Begin](#before-you-begin)
- [Installation](#installation)
- [`Hunter` Class APIs Reference](#hunter-class-apis-reference)
  - [Properties](#properties)
    - [Static Properties](#static-properties)
    - [Instance Properties](#instance-properties)
  - [Methods (Instance-Only)](#methods)
    - [Constructor](#constructor)
    - [Public Methods](#public-methods)
    - [Private Methods](#private-methods)
    - [Events Handling](#events-handling)
- [Usage And Examples](#usage-and-examples)
  - [`HunterConfig` Reference](#hunterconfig-reference)
  - [`HunterLogConfig` Reference](#hunterlogconfig-reference)
- [About Project Backend](#about-project-backend)
- [License](#license)
- [Code of Conduct](#code-of-conduct)
- [Contributing](#contributing)
- [Author](#author)

## Features

1. **Realtime Error Tracking**: Uses `process` object to listen for any uncaught or rejected promise exceptions in realtime.
2. **Automatic Bug Reporting**: Quickly reports issue to application owner via *Email* and/or *Log*.
3. **Flexible Configuration**: Customize the error reporting behavior with configurable `HunterConfig` options.
4. **Detailed Context**: Provides detailed *stack-trace* and *code-context* to help you quickly understand and debug issues.
5. **Cluster Tracking**: Track logs, Monitor system performance & Analyze your Node.js servers cluster in realtime.
6. **Very Simple Integration**: Just 8 to 12 lines of code and you're ready to shoot all your application bugs.

## ToDo

- [x] ~Add HTML/Text type email sending logic with templates.~
- [x] ~Add feature to implement logging functionality.~
- [x] ~Add feature for magic-link email verification.~
- [x] ~Integrate Realtime monitoring dashboard.~
- [ ] Add system helth monitoring feature.
- [ ] Implement Custom metrics & actions.

## Bug Hunter VS pm2 Plus Monitoring Service

> Motivation & Idea of this project was taken from [pm2 Plus](https://pm2.io)

| Feature                        | Bug Hunter                   | pm2 Plus Monitoring Service |
|--------------------------------|------------------------------|-----------------------------|
| Error Tracking                 | ✔️                           | ✔️                         |
| Code Context                   | ✔️                           | ✔️                         |
| Open Source                    | ✔️ (Full)                    | ✔️ (Partial)               |
| Realtime Monitoring Dashboard  | ✔️                           | ✔️                         |
| Reporting Options              | Email & Log                  | Real-time Dashboard         |
| Flexibility                    | High                         | Moderate                    |
| Data Handling                  | Automatic                    | Real-time Monitoring        |
| Cost                           | Open Source and Free         | Paid                        |

## Anatomy

Bug-Hunter application contains two frontend components accessible to user, the **Web Component** & the **Package Component**

#### Web Component

It's the front face of Bug-Hunter and this is where you create your Controller account, track your servers cluster & monitor or control them remotely as and when you want, all for free!

> It's programmed in vanilla TS along with HTML & CSS, [Hunter-UI](https://github.com/Techzy-Programmer/Hunter-UI) is where it's openly available on GitHub. You can find the production hosted [web-app here](https://bug-hunter.040203.xyz).

#### Package Component

It's the handling component of Bug-Hunter and this is what you use to link your server to your Controller account, allowing you to monitor it remotely from web interface anytime.

> It's programmed in vanilla TS, this repository is all about the Package Component of Bug-Hunter itself, binary built package is hosted on [npm](https://www.npmjs.com/package/bug-hunter).

## Before You Begin

As Bug-Hunter is providing cloud-services you need to have a Controller account & gain access to your API-Key to interact with our services, please follow these steps to get free API access. We are offering password-less authentication. 

- 1. [Register or Login](https://bug-hunter.040203.xyz) with your email.
- 2. Navigate to the **Keys** section, copy the API key and proceed with next step.

> **Note**: Complete API key is not displayed directly in console for security reasons, always use **Copy** button to copy it to the clipboard.

## Installation

Install the package using

> NPM:
```bash
npm install bug-hunter
```

> Yarn:
```bash
yarn add bug-hunter
```

## Hunter Class APIs Reference

`Hunter` class is the central component of the Bug-Hunter package, designed to capture and report uncaught exceptions, perform logging, and monitor systems in Node.js applications. Below is the API reference for the `Hunter` class.

### Properties

#### Static Properties

- `working` (boolean): Indicates whether the Hunter is actively engaged in system monitoring and error reporting.
- `isKeyValid` (boolean): Reflects the validity of the provided API key after validation.

#### Instance Properties

- `config` (HunterConfig): The configuration object for the Hunter instance.
- `logConfig` (HunterLogConfig): The logging configuration object, if logging is enabled.

### Methods

#### Constructor

- `constructor(conf: HunterConfig)`: Initializes a new instance of the `Hunter` class with the provided configuration.

#### Public Methods

- `startHunting(): boolean`: Begins the error hunting process by attaching event listeners to the process object. Returns `false` if the process is already running.
- `stopHunting()`: Stops the error hunting process by removing event listeners and disposing of resources.
- `setLogging(enable: boolean, lconfig?: HunterLogConfig)`: Enables or disables local logging functionality based on the `enable` flag and optional `lconfig` logging configuration.

#### Private Methods

- `validateAPIKey(): Promise<string>`: Validates the API key and returns a message indicating the result.
- `handleUncaughtException(err: Error)`: Handles uncaught exceptions by reporting them to the server and optionally logging them locally.
- `handleUnhandledRejection(reason: {}, rejPromise: Promise<any>)`: Placeholder for handling unhandled rejections. Logic to be implemented.

#### Events Handling

- `on("key-status", (validated: boolean) => void)`: Emits an event indicating the status of the API key validation, if `validated` is `true` indicates successful validation & authorization of provided `apiKey`.

## Usage And Examples

Begin by importing the `Hunter` class from the 'bug-hunter' module. Then proceed with initialization of the `Hunter` class, providing an object of type [`HunterConfig`](#hunterconfig-reference) to the constructor. You can then start Bug-Hunter process as demonstrated in the example below.

Furthermore, if you wish to enable local logging functionality, you have the option of passing an object of type [`HunterLogConfig`](#hunterlogconfig-reference) to the `setLogging` method of the `Hunter` instance object, as illustrated in the following example.

```javascript
import { Hunter } from 'bug-hunter'; // for ModuleJS configuaration

// Refer below this code snippet for more details on `HunterConfig`
const hunterConfig = {
    apiKey: "caUMxA.#######:**********************", // Your API key
    email: "user-name@provider.ext", // Email linked with your Controller account
    appName: "My Server 1", // Give a descriptive name, purely for your reference
    // More optional properties....
};

// Refer to `HunterLogConfig` section for more details
const logConfig = {
    logDir: "/path/to/log-folder",
    maxFileSizeMB: 5,
    logType: "json",
}

const hunter = new Hunter(hunterConfig);

// Starting version 0.7.0 `Hunter` extends `EventEmitter`
hunter.on("key-status", (validated) => {
    if (!validated) {
        console.log("Key validation failed!");
        return;
    }

    // Until this point in time any error that may originate will not be reported via email as API-Key was not yet authorized
    console.log("Key validated!");

    // Following code can throw unhandled errors....
    let buggyObject = {
        name: "John"
    };

    buggyObject.name(); // <== Oops! error occured (buggyObject.name is not a function)
    // But don't worry `Hunter` process will immediately catch & notify you of this error in realtime

    console.log("Hello, hi!"); // <= This will not get executed but your program can keep running if `quitOnError` is set to `false`
});

hunter.setLogging(true, logConfig); // By default local logging is disabled you need to enable it explicitly
hunter.startHunting(); // Start shooting bugs....

// Your potential program code goes here....

hunter.setLogging(false); // If you ever need to stop logging locally
hunter.stopHunting(); // To dispose off resources and stop `Hunter` process completely
```

You can use this module in CommonJS configuarations also like this

```javascript
const { Hunter } = require("bug-hunter");
const hunter = new Hunter(hunterConfig);
// Rest of code is same as shown in the above example
```

#### HunterConfig Reference

| Property               | Type                                 | Required | Default   | Description                                    |
|------------------------|--------------------------------------|----------|-----------|------------------------------------------------|
| email                  | string                               | ✔️       |           | Email linked with your controller account      |
| apiKey                 | string                               | ✔️       |           | Your API key for service authentication        |
| appName                | string                               | ✔️       |           | Name of the application or server              |
| enableRemoteMonitoring | boolean                              | ❌       | true      | Enable your server to be monitored from Web UI |
| includeCodeContext     | boolean                              | ❌       | true      | Include code context in error reports          |
| enableSourceMap        | boolean                              | ❌       | false     | Enable source mapping for code context         |
| quitOnError            | boolean                              | ❌       | false     | Quit application when error occurs             |
| cwdFilter              | boolean                              | ❌       | false     | Filter out stack entries outside CWD           |
| format                 | "html" or "text"                     | ❌       | "html"    | Format in which you want to receive emails     |

> Refer [types.ts](src/types.ts) for `HunterConfig` implementation

#### HunterLogConfig Reference

| Property      | Type             | Required  | Default | Description                                       |
|---------------|------------------|-----------|---------|---------------------------------------------------|
| logDir        | string           | ✔️        |         | Path where logs should be saved                   |
| maxFileSizeMB | number           | ❌        | 10      | Maximum size for a single log file                |
| logType       | "text" or "json" | ❌        | "text"  | Format of log 'human-readable' or 'structured'    |

> Refer [types.ts](src/types.ts) for `HunterLogConfig` implementation

## About Project Backend

Project's backend is developed in Typescript under NodeJS environment and is hosted on [Cloudflare Worker](https://workers.cloudflare.com), we utilize [MailChannel's](https://www.mailchannels.com/) API to facilitate the transmission of emails via Cloudflare's IP in accordance with the duo partnership as discussed [in this blog](https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels).

Currently, the backend remains proprietary; nevertheless I'm considering making it open-sourced in the near future. The HTML and Text templates used by the server to send email notifications are publicly available within this repository. You can locate them in the [src/web](src/web/) directory.

## License

This project is licensed under the MIT License.
Please refer to the [**LICENSE**](LICENSE) file for more details.

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all, regardless of gender, sexual orientation, disability, ethnicity, or religion. Please review our [Code of Conduct](CODE_OF_CONDUCT.md) to understand the standards of behavior we expect from all participants in this project.

## Contributing

Contributions are welcome! To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch.
3. Make your changes and commit them.
4. Open a pull request with a detailed description of your changes.

Your contributions help improve the project and create a welcoming community for all developers.

#### Reporting Issues

If you encounter any issues with the project or have suggestions for improvements, please [open an issue](https://github.com/Techzy-Programmer/Bug-Hunter/issues). We appreciate your feedback and involvement in enhancing the Bug Hunter experience!

## Author

- Rishabh Kumar
- [LinkedIn Profile](https://www.linkedin.com/in/rishabh-kumar-438751207)
- [Contact via Email](mailto:admin@040203.xyz)
