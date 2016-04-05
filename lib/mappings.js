var obj = {
  image: {
      properties: {
          "BitsPerSample": {
              "type": "long"
          },
          "CaptionWriter": {
              "type": "string",
              "fields": {
                  "raw" : {
                    "type": "string",
                    "index": "not_analyzed"
                  }
              }
          },
          "Category": {
              "type": "string",
              "boost" : 1.2,
              "fields": {
                  "raw" : {
                    "type": "string",
                    "index": "not_analyzed"
                  }
              }
          },
          "City": {
              "type": "string",
              "boost" : 1.2
          },
          "ColorComponents": {
              "type": "long"
          },
          "ColorMode": {
              "type": "string",
              "fields": {
                  "raw" : {
                    "type": "string",
                    "index": "not_analyzed"
                  }
              }
          },
          "ColorSpaceData": {
              "type": "string"
          },
          "Comment": {
              "type": "string",
              "boost" : 1.5
          },
          "CopyrightFlag": {
              "type": "boolean"
          },
          "CopyrightNotice": {
              "type": "string"
          },
          "Country": {
              "type": "string"
          },
          "CountryCode": {
              "type": "string"
          },
          "CreatorTool": {
              "type": "string"
          },
          "Credit": {
              "type": "string",
              "fields": {
                  "raw" : {
                    "type": "string",
                    "index": "not_analyzed"
                  }
              }
          },
          "DateCreated": {
              "type": "date",
              "format": "yyyy-mm-dd HH:mm",
              "boost" : 1.3
          },
          "Description": {
              "type": "string",
              "boost" : 1.6,
              "fields": {
                  "raw" : {
                    "type": "string",
                    "index": "not_analyzed"
                  }
              }
          },
          "DeviceAttributes": {
              "type": "string"
          },
          "Directory": {
              "type": "string"
          },
          "EncodingProcess": {
              "type": "string"
          },
          "ExifImageHeight": {
              "type": "long"
          },
          "ExifImageWidth": {
              "type": "long"
          },
          "ExifToolVersion": {
              "type": "double",
              "index" : "no"
          },
          "FileAccessDate": {
              "type": "date",
              "format": "yyyy-mm-dd HH:mm"
          },
          "FileCreateDate": {
              "type": "date",
              "format": "yyyy-mm-dd HH:mm"
          },
          "FileModifyDate": {
              "type": "date",
              "format": "yyyy-mm-dd HH:mm"
          },
          "FileName": {
              "type": "string"
          },
          "FileSize": {
              "type": "string"
          },
          "FileType": {
              "type": "string"
          },
          "HasCrop": {
              "type": "boolean",
              "index" : "no"
          },
          "ImageHeight": {
              "type": "long"
          },
          "ImageSize": {
              "type": "string"
          },
          "ImageWidth": {
              "type": "long"
          },
          "Instructions": {
              "type": "string"
          },
          "Keywords": {
              "type": "string",
              "boost" : 1.7
          },
          "MIMEType": {
              "type": "string"
          },
          "ObjectName": {
              "type": "string"
          },
          "ObjectTypeReference": {
              "type": "string",
              "boost" : 1.2
          },
          "Orientation": {
              "type": "string"
          },
          "OriginatingProgram": {
              "type": "string"
          },
          "PhotometricInterpretation": {
              "type": "string"
          },
          "ProfileConnectionSpace": {
              "type": "string"
          },
          "ProfileDateTime": {
              "type": "date",
              "format": "yyyy-mm-dd HH:mm"
          },
          "ProfileFileSignature": {
              "type": "string"
          },
          "ReleaseDate": {
              "type": "date",
              "format": "yyyy-mm-dd HH:mm"
          },
          "RenderingIntent": {
              "type": "string"
          },
          "ResolutionUnit": {
              "type": "string"
          },
          "Rights": {
              "type": "string",
              "fields": {
                  "raw" : {
                    "type": "string",
                    "index": "not_analyzed"
                  }
              }
          },
          "Source": {
              "type": "string"
          },
          "SourceFile": {
              "type": "string"
          },
          "SpecialInstructions": {
              "type": "string"
          },
          "State": {
              "type": "string",
              "boost" : 1.3
          },
          "Subject": {
              "type": "string",
              "boost" : 1.6
          },
          "SupplementalCategories": {
              "type": "string",
              "boost" : 1.3
          },
          "name_hash" : {
            "type": "string",
            "index": "not_analyzed"
          },
          "Title": {
              "type": "string",
              "boost" : 1.3
          },
          "UserDefined3": {
              "type": "string",
              "boost" : 1.6
          },
          "XMPFileStamps": {
              "type": "string"
          },
          "XResolution": {
              "type": "long"
          },
          "YResolution": {
              "type": "long"
          },
          "archive": {
              "type": "string",
              "boost" : 1.5,
              "fields": {
                  "raw" : {
                    "type": "string",
                    "index": "not_analyzed"
                  }
              }
          }




      }
  }
};


module.exports = obj;
