const fs = require('fs');

let content = fs.readFileSync('src/controllers/chat.controller.js', 'utf8');

content = content.replace(
  '    return res.json({ messages, avgResponseTime, ticketId });\r\n  } catch (err) {\r\n    return res.json({ messages, avgResponseTime, ticketId });\r\n  } catch (err) {\r\n    console.error("adminGetThread error", err);',
  '    return res.json({ messages, avgResponseTime, ticketId });\r\n  } catch (err) {\r\n    console.error("adminGetThread error", err);'
);

content = content.replace(
  '    return res.json({ messages, avgResponseTime, ticketId });\n  } catch (err) {\n    return res.json({ messages, avgResponseTime, ticketId });\n  } catch (err) {\n    console.error("adminGetThread error", err);',
  '    return res.json({ messages, avgResponseTime, ticketId });\n  } catch (err) {\n    console.error("adminGetThread error", err);'
);

fs.writeFileSync('src/controllers/chat.controller.js', content);
console.log('Fixed syntax error!');
