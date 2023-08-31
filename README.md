# Bug-Hunter: NodeJS error reporting service

[![Version npm](https://img.shields.io/npm/v/bug-hunter.svg?logo=npm)](https://www.npmjs.com/package/bug-hunter)

Bug Hunter is a robust error reporting solution tailored for Node.js applications. It seamlessly captures uncaught exceptions and unhandled rejections, providing in-depth insights through detailed error stacks and contextual code snippets. With configurable reporting options, including email and logging, Bug Hunter ensures effective monitoring and prompt debugging for enhanced application stability.

> :warning: **Warning** Reporting via logging is not yet implemented.

## Table Of Contents
- [Features](#features)
- [ToDo](#todo)
- [Comparison with pm2](#bug-hunter-vs-pm2-plus-monitoring-service)
- [Installation](#installation)
- [Usage And Examples](#usage-and-examples)
  - [HunterConfig Reference](#hunterconfig-reference)
- [About Project Backend](#about-project-backend)
- [License](#license)
- [Contributing](#contributing)
- [Author](#author)

## Features

1. **Realtime Error Tracking**: Uses `process` object to listen for any uncaught or rejected promise exceptions in realtime.
2. **Automatic Bug Reporting**: Quickly reports issue to application owner via *Email* or *Log*.
3. **Flexible Configuration**: Customize the error reporting behavior with configurable `HunterConfig` options.
4. **Detailed Context**: Provides detailed *stack-trace* and *code-context* to help you quickly understand and debug issues.
5. **Very Simple Integration**: Just 5 to 6 lines of code and you're ready to hunt all your application bugs.

## ToDo

- [x] ~Add HTML/Text type email sending logic with templates.~
- [ ] Add feature to implement logging functionality.
- [ ] Implement Realtime monitoring dashboard.

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

Import the `Hunter` class from 'bug-hunter' module, then create instance of `Hunter` class by passing [`HunterConfig`](#hunterconfig-reference) as optional config object and start the error hunting job as shown in the example below

```javascript
import { Hunter } from 'bug-hunter'; // for ModuleJS configuaration

// Refer below this code snippet for more details on `HunterConfig`
let hunterConfig = {
    includeCodeContext: true,
    reportingType: "email",
    quitOnError: false,
    appName: "Test",
    // more....
}

const hunter = new Hunter(hunterConfig);
hunter.startHunting();

// Your program code goes here which can potentially throw unhandled errors....
let buggyObject = {
    name: "John"
};

buggyObject.name(); // <== Oops! error occured (buggyObject.name is not a function)
// But don't worry `Hunter` will immediately catch & notify you of this error in realtime

// If you no longer want to listen for errors anymore
hunter.stopHunting(); // Just call this
```

You can use this module in CommonJS configuarations also like this

```javascript
const { Hunter } = require("bug-hunter");
const hunter = new Hunter();
// Rest code same as shown in above example
```

#### HunterConfig Reference

> Base properties for `HunterConfig`

| Property           | Type                    | Required | Default       | Description                             |
|--------------------|-------------------------|----------|---------------|-----------------------------------------|
| reportingType      | "email" or "log"        | ✔️       | "log"         | Type of error reporting: email or log   |
| includeCodeContext | boolean                 | ❌       | false         | Include code context in error reports   |
| enableSourceMap    | boolean                 | ❌       | false         | Enable source map for code context      |
| quitOnError        | boolean                 | ❌       | false         | Quit application on error               |
| cwdFilter          | boolean                 | ❌       | false         | Filter out stack entries outside CWD    |
| appName            | string                  | ✔️       | "Default"     | Name of the application                 |

> For `reportingType` as `"email"` then following properties must be used @`HunterEmailConfig`

| Property          | Type                         | Required | Default | Description                        |
|-------------------|------------------------------|----------|---------|------------------------------------|
| antiPhishingPhrase| string                       | ❌       | -       | Anti-phishing phrase for emails    |
| format            | "html" or "text"             | ✔️       | -       | Format of email you want           |
| reportingType     | "email"                      | ✔️       | -       | Always 'email' for this config     |
| address           | [{name: "", email: ""}, ...] | ✔️       | -       | Array of email addresses with name |

> For `reportingType` as `"log"` then following properties must be used @`HunterLogConfig`

| Property       | Type              | Required | Default | Description                          |
|----------------|-------------------|----------|---------|--------------------------------------|
| logType        | "json" or "text"  | ✔️       | -       | Log type: JSON or text              |
| reportingType  | "log"             | ✔️       | -       | Always 'log' for this config        |
| maxFileSize    | number            | ✔️       | -       | Maximum log file size in megabytes  |
| logDir         | string            | ✔️       | -       | Directory for log files             |

> Refer [types.ts](src/types.ts) for `HunterConfig` implementation

> Quick example on above demonstration

```typescript
// Use this config for email reporting
const emailConfig = {
    format: 'html',
    reportingType: 'email',
    includeCodeContext: true,
    appName: '<Your App Name>',
    antiPhishingPhrase: 'Safety@1234',
    address: [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
    ]
};

// Use this config for log reporting
const logConfig = {
    includeCodeContext: true,
    reportingType: 'log',
    appName: 'MyApp',
    logType: 'json',
    maxFileSize: 10,
    logDir: './logs/'
};
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
- [Contact via Email](mailto:rishabh.kumar.pro@gmail.com)
