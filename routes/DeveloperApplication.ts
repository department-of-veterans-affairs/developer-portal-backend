export default function developerApplicationHandler(kong, okta, dynamo, govdelivery, slack) {
  return function (req, res) {
    res.send('success')
  }
}
