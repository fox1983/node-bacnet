'use strict'

const async = require('async')
const bacnet = require('../bacnet.js')
const r = bacnet.init({
  datalink: {
    iface: process.argv[2],
    ip_port: 0xBAC0
  },
  device: false
})

r.on('error', err => console.log('error in bacnet', err))

function objectIdToString (objectId) {
  return bacnet.objectTypeToString(objectId.type) + '/' + objectId.instance
}

const deviceProperties = ['object-identifier', 'object-name', 'description', 'system-status', 'vendor-name',
  'vendor-identifier', 'model-name', 'firmware-revision', 'application-software-version', 'location', 'local-time', 'local-date',
  'utc-offset', 'daylight-savings-status', 'protocol-version', 'protocol-revision',
  'protocol-services-supported', /*'object-types-supported'*/ 96, /* may be too long 'object-list',*/ 'max-apdu-length-accepted',
  'segmentation-supported', 'apdu-timeout', 'number-of-apdu-retries', /*'device-address-binding',*/ 'database-revision',
  'max-info-frames', 'max-master', //'active-cov-subscriptions'
]

r.on('iam', function (iam) {
  console.log('iam: ', iam)
  let deviceId = iam.deviceId
  async.mapSeries(deviceProperties, (propertyName, propertyRead) =>
      r.readProperty(deviceId, 'device', deviceId, propertyName, false, (err, propertyValue) => {
        if (err) {
          propertyRead(null, 'FAILED')
        } else {
          propertyRead(null, propertyValue.value)
        }
      }),
    (err, values) => {
      if (err) {
        console.log('error', err)
        return objectRead(null, false)
      }
      console.log(deviceProperties.reduce((result, key, index) => {
        if (values[index].length == 1) result[key] = values[index][0]
        else result[key] = values[index]
        return result
      }, {}))
    })
})

r.whois(process.argv[3])

setTimeout(function () {}, 1000)
