# Bug-Hunter: NodeJS error reporting service

[![Version npm](https://img.shields.io/npm/v/bug-hunter.svg?logo=npm)](https://www.npmjs.com/package/bug-hunter)

Bug Hunter is a robust error reporting solution tailored for Node.js applications. It seamlessly captures uncaught exceptions and unhandled rejections, providing in-depth insights through detailed error stacks and contextual code snippets. With configurable reporting options, including email and logging, Bug Hunter ensures effective monitoring and prompt debugging for enhanced application stability.

## Table Of Contents
- [Features](#features)
- [ToDo](#todo)
- [Comparison with pm2](#bug-hunter-vs-pm2-plus-monitoring-service)
- [Installation](#installation)
- [Usage And Examples](#usage-and-examples)
  - [`HunterConfig` Reference](#hunterconfig-reference)
  - [`HunterLogConfig` Reference](#hunterlogconfig-reference)
- [About Project Backend](#about-project-backend)
- [License](#license)
- [Contributing](#contributing)
- [Author](#author)

## Features

1. **Realtime Error Tracking**: Uses `process` object to listen for any uncaught or rejected promise exceptions in realtime.
2. **Automatic Bug Reporting**: Quickly reports issue to application owner via *Email* and *Log* (optional).
3. **Flexible Configuration**: Customize the error reporting behavior with configurable `HunterConfig` options.
4. **Detailed Context**: Provides detailed *stack-trace* and *code-context* to help you quickly understand and debug issues.
5. **Very Simple Integration**: Just 8 to 10 lines of code and you're ready to hunt all your application bugs.

## ToDo

- [x] ~Add HTML/Text type email sending logic with templates.~
- [x] ~Add feature to implement logging functionality.~
- [ ] Implement user based cloud authorization
- [ ] Add feature for magic-link email verification
- [ ] Integrate Realtime monitoring dashboard.

## Bug Hunter VS pm2 Plus Monitoring Service

> Motivation & Idea of this project was taken from [pm2 Plus](https://pm2.io)

| Feature                        | Bug Hunter                   | pm2 Plus Monitoring Service |
|--------------------------------|------------------------------|-----------------------------|
| Error Tracking                 | ✔️                           | ✔️                         |
| Code Context                   | ✔️ (Available)               | ❌                         |
| Open Source                    | ✔️ (Full)                    | ✔️ (Partial)               |
| Realtime Monitoring Dashboard  | ❌                           | ✔️                         |
| Reporting Options              | Email & Log                  | Real-time Dashboard         |
| Flexibility                    | High                         | Moderate                    |
| Data Handling                  | Automatic                    | Real-time Monitoring        |
| Cost                           | Open Source (Free)           | Paid                        |

## Installation

Install the package using npm:

```bash
npm i bug-hunter
```

## Usage And Examples

Begin by importing the `Hunter` class from the 'bug-hunter' module. Then, proceed to instantiate the `Hunter` class, optionally providing an object of type [`HunterConfig`](#hunterconfig-reference) to the constructor. You can initiate error hunting process as demonstrated in the example below.

Furthermore, if you wish to enable local logging functionality, you have the option of passing an object of type [`HunterLogConfig`](#hunterlogconfig-reference) to the `setLogging` method of the `Hunter` instance object, as illustrated in the following example.

```javascript
import { Hunter } from 'bug-hunter'; // for ModuleJS configuaration

// Refer below this code snippet for more details on `HunterConfig`
const hunterConfig = {
    includeCodeContext: true,
    reportingType: "email",
    quitOnError: false,
    appName: "Test",
    // more....
}

// Refer to `HunterLogConfig` section for more details
const logConfig = {
    logDir: "./data/my-logs",
    maxFileSizeMB: 5,
    logType: "text",
}

const hunter = new Hunter(hunterConfig);
// By default logging is disabled you need to enable it explicitly
hunter.setLogging(true, logConfig);
hunter.startHunting(); // Start shooting bugs....

// Your program code goes here which can potentially throw unhandled errors....
let buggyObject = {
    name: "John"
};

buggyObject.name(); // <== Oops! error occured (buggyObject.name is not a function)
// But don't worry `Hunter` will immediately catch & notify you of this error in realtime

// If you ever need to stop logging
hunter.setLogging(false); // This is enough

// If you no longer want to listen for errors anymore
hunter.stopHunting(); // Just call this
```

You can use this module in CommonJS configuarations also like this

```javascript
const { Hunter } = require("bug-hunter");
const hunter = new Hunter();
// Rest of code is same as shown in the above example
```

#### HunterConfig Reference

| Property           | Type                                 | Required | Default   | Description                           |
|--------------------|--------------------------------------|----------|-----------|---------------------------------------|
| antiPhishingPhrase | string                               | ❌       | -         | Anti-phishing phrase for emails       |
| includeCodeContext | boolean                              | ❌       | true      | Include code context in error reports |
| enableSourceMap    | boolean                              | ❌       | false     | Enable source map for code context    |
| quitOnError        | boolean                              | ❌       | false     | Quit application on error             |
| cwdFilter          | boolean                              | ❌       | false     | Filter out stack entries outside CWD  |
| appName            | string                               | ✔️       | -         | Name of the application               |
| format             | "html" or "text"                     | ❌       | "html"    | Format of email you want              |
| address            | [{name: string, email: string}, ...] | ✔️       | -         | Array of email addresses with name    |

> Refer [types.ts](src/types.ts) for `HunterConfig` implementation

> Quick example on above reference

```javascript
const config = {
    includeCodeContext: true,
    appName: '<Your App Name>',
    antiPhishingPhrase: 'Safety@1234',
    address: [ // List should contain at least one entry and at most five
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
    ]
};
```

#### HunterLogConfig Reference

| Property      | Type             | Required | Default | Description                                      |
|---------------|------------------|----------|---------|--------------------------------------------------|
| logDir        | string           | ✔️       | -      | Path where logs should be saved                   |
| maxFileSizeMB | number           | ❌       | 10     | Maximum size for a single log file                |
| logType       | "text" or "json" | ❌       | "text" | Format of log 'human-readable' or 'structured'    |

> Refer [types.ts](src/types.ts) for `HunterLogConfig` implementation

> Quick example on above reference

```javascript
const logConfig = {
    logDir: "./data/logs", // Directory will be created if doesn't exists
    maxFileSizeMB: 5,
    logType: "json"
};

hunter.setLogging(true, logConfig);
```

## About Project Backend

Project's backend is developed in Typescript under NodeJS environment and is hosted on [Cloudflare Worker](https://workers.cloudflare.com), we utilize [MailChannel's](https://www.mailchannels.com/) API to facilitate the transmission of emails via Cloudflare's IP in accordance with the duo partnership as discussed [in this blog](https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels).

Currently, the backend remains proprietary; nevertheless I'm considering making it open-sourced in the near future. The HTML and Text templates used by the server to send email notifications are publicly available within this repository. You can locate them in the [src/web](src/web/) directory.

## License

This project is licensed under the MIT License.
Please refer to the [**LICENSE**](LICENSE) file for more details.

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
