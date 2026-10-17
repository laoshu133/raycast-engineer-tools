#import <AppKit/AppKit.h>

// Read only the current pasteboard. No clipboard history or temporary-file
// representation is involved, and no Apple Events permission is needed.
static NSDictionary *readClipboard(NSPasteboard *pasteboard, NSError **error) {
  for (NSUInteger attempt = 0; attempt < 3; attempt++) {
    NSInteger changeCount = pasteboard.changeCount;
    NSMutableArray<NSString *> *files = [NSMutableArray array];
    for (NSPasteboardItem *item in pasteboard.pasteboardItems) {
      if (![item.types containsObject:NSPasteboardTypeFileURL]) continue;
      NSString *string = [item stringForType:NSPasteboardTypeFileURL];
      NSURL *url = string ? [NSURL URLWithString:string] : nil;
      if (url.isFileURL && url.path && ![files containsObject:url.path]) [files addObject:url.path];
    }
    NSString *text = files.count == 1 ? files.firstObject : files.count > 1 ? @"" :
      ([pasteboard stringForType:NSPasteboardTypeString] ?: @"");
    NSData *data = [text dataUsingEncoding:NSUTF8StringEncoding];
    if (changeCount != pasteboard.changeCount) continue;
    if (data.length > 64 * 1024 * 1024) {
      *error = [NSError errorWithDomain:@"ClipboardReader" code:1
        userInfo:@{NSLocalizedDescriptionKey: @"Clipboard text exceeds 64 MiB"}];
      return nil;
    }
    return @{ @"textBase64": [data base64EncodedStringWithOptions:0], @"files": files };
  }
  *error = [NSError errorWithDomain:@"ClipboardReader" code:2
    userInfo:@{NSLocalizedDescriptionKey: @"Clipboard changed while reading; try again"}];
  return nil;
}

#ifndef CLIPBOARD_READER_TEST
int main(void) {
  @autoreleasepool {
    NSError *error = nil;
    NSDictionary *input = readClipboard(NSPasteboard.generalPasteboard, &error);
    NSData *json = input ? [NSJSONSerialization dataWithJSONObject:input options:0 error:&error] : nil;
    if (!json) {
      fprintf(stderr, "%s\n", error.localizedDescription.UTF8String);
      return 1;
    }
    [NSFileHandle.fileHandleWithStandardOutput writeData:json];
  }
  return 0;
}
#endif
