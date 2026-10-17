#define CLIPBOARD_READER_TEST
#import "clipboard-reader.m"
#include <assert.h>

int main(void) {
  @autoreleasepool {
    NSPasteboard *pasteboard = [NSPasteboard pasteboardWithUniqueName];
    NSError *error = nil;
    NSString *(^text)(NSDictionary *) = ^NSString *(NSDictionary *input) {
      NSData *data = [[NSData alloc] initWithBase64EncodedString:input[@"textBase64"] options:0];
      return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    };
    [pasteboard clearContents];
    NSDictionary *empty = readClipboard(pasteboard, &error);
    assert(error == nil && [text(empty) isEqualToString:@""] && [empty[@"files"] count] == 0);

    NSString *largeText = [@"中文🙂\n\t" stringByPaddingToLength:700003 withString:@"中文🙂\n\t" startingAtIndex:0];
    [pasteboard setString:largeText forType:NSPasteboardTypeString];
    NSDictionary *large = readClipboard(pasteboard, &error);
    assert([text(large) isEqualToString:largeText] && [large[@"files"] count] == 0);

    [pasteboard clearContents];
    [pasteboard setString:@"file-history-reference.txt" forType:NSPasteboardTypeString];
    assert([readClipboard(pasteboard, &error)[@"files"] count] == 0);

    NSURL *first = [NSURL fileURLWithPath:@"/tmp/中文 file🙂.png"];
    NSURL *second = [NSURL fileURLWithPath:@"/tmp/second.bin"];
    [pasteboard clearContents];
    [pasteboard writeObjects:@[first]];
    NSDictionary *single = readClipboard(pasteboard, &error);
    assert([single[@"files"] isEqual:@[first.path]] && [text(single) isEqualToString:first.path]);

    [pasteboard clearContents];
    [pasteboard writeObjects:@[first, second]];
    NSDictionary *multiple = readClipboard(pasteboard, &error);
    assert([multiple[@"files"] isEqual:(@[first.path, second.path])] && [text(multiple) isEqualToString:@""]);
    [pasteboard releaseGlobally];
    puts("Native clipboard: empty, large Unicode text, plain-text references, single and multiple file URLs passed");
  }
  return 0;
}
